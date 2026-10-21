import { and, asc, eq, or, sql } from "drizzle-orm";
import { db } from "./db";
import { funnels, leads, leadStageEvents, recruitingMailJobs, funnelRecruitingConfigs } from "@shared/schema";
import { DEFAULT_PIPELINE } from "@shared/recruiting-contract";

/**
 * Owner-scoped preparation of a subject access response. Soft-deleted funnels
 * and Free-plan leads remain searchable. A repeatable-read snapshot keeps the
 * lead, history and outbox consistent if a stage changes during the export.
 */
export async function exportSubjectData(ownerId: number, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const ownerScope = and(eq(leads.userId, ownerId), eq(funnels.userId, ownerId));
  const leadEmailMatches = sql`lower(btrim(${leads.email})) = ${normalizedEmail}`;
  return db.transaction(async tx => {
    const matched = await tx.select({
      lead: leads,
      funnelName: funnels.name,
      funnelDeletedAt: funnels.deletedAt,
      stages: funnelRecruitingConfigs.stages,
    }).from(leads)
      .innerJoin(funnels, eq(funnels.id, leads.funnelId))
      .leftJoin(funnelRecruitingConfigs, eq(funnelRecruitingConfigs.funnelId, funnels.id))
      .where(and(ownerScope, leadEmailMatches))
      .orderBy(asc(leads.createdAt), asc(leads.id));

    const events = await tx.select({ event: leadStageEvents }).from(leadStageEvents)
      .innerJoin(leads, eq(leads.id, leadStageEvents.leadId))
      .innerJoin(funnels, eq(funnels.id, leads.funnelId))
      .where(and(ownerScope, leadEmailMatches))
      .orderBy(asc(leadStageEvents.createdAt), asc(leadStageEvents.id));

    // A lead's email may have changed since an email was queued or sent.
    // Export a matching recipient's stored message without disclosing that
    // lead's current contact details or unrelated stage history.
    const jobs = await tx.select({ job: recruitingMailJobs }).from(recruitingMailJobs)
      .innerJoin(leads, eq(leads.id, recruitingMailJobs.leadId))
      .innerJoin(funnels, eq(funnels.id, leads.funnelId))
      .where(and(ownerScope, eq(recruitingMailJobs.ownerId, ownerId), or(
        leadEmailMatches,
        sql`lower(btrim(${recruitingMailJobs.recipient})) = ${normalizedEmail}`,
      )))
      .orderBy(asc(recruitingMailJobs.createdAt), asc(recruitingMailJobs.id));

    return {
      schemaVersion: 2,
      email: normalizedEmail,
      exportedAt: new Date().toISOString(),
      count: matched.length,
      leads: matched.map(({ lead, funnelName, funnelDeletedAt, stages }) => ({
        ...lead, funnelName, funnelDeletedAt,
        // Labels describe the currently stored pipeline, not historic labels.
        currentRecruitingStages: stages ?? DEFAULT_PIPELINE,
      })),
      recruiting: {
        stageEvents: events.map(({ event }) => event),
        mailJobs: jobs.map(({ job }) => job),
      },
      scope: {
        description: "Lead- und Bewerbungsdaten des angemeldeten Kontos zur angegebenen E-Mail-Adresse.",
        matching: "Groß-/Kleinschreibung und äußere Leerzeichen werden ignoriert. Gesucht wird in Lead-E-Mail und gespeicherten Recruiting-Mail-Empfängern.",
        included: [
          "Lead-Daten einschließlich Antworten, Antwort-Snapshots und gespeicherter Einwilligungsangaben",
          "Statusverlauf der passenden Leads und derzeit gespeicherte Spaltenbezeichnungen",
          "Gespeicherte Recruiting-Mails einschließlich Inhalt, Empfänger und Versandstatus",
          "Vorhandene Daten aus gelöschten Funnels und aus im Free-Plan gesperrten Leads",
        ],
        manualReview: [
          "Identität und Umfang der Anfrage sowie Angaben über andere Personen vor Weitergabe prüfen.",
          "Weitere E-Mail-Adressen und andere Suchmerkmale gesondert prüfen.",
          "Supportmeldungen und Anhänge, Postfächer, Backups sowie Kopien in Webhooks und weiteren Integrationen gesondert prüfen.",
          "Die Datei unterstützt die Bearbeitung der Anfrage; ergänzende Auskunftsinformationen stellt der Verantwortliche zusammen.",
        ],
      },
    };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}
