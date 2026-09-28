import { createHash, randomUUID, randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { funnels, funnelRevisions, users, FREE_MAX_PUBLISHED_FUNNELS, type Funnel } from "@shared/schema";
import { documentFromFunnel, documentSchema, DOCUMENT_VERSION, type WriteControl, type FunnelRevisionSummary, type FunnelDocument } from "@shared/funnel-document";
import { hasProFeatures } from "./auth";

type FunnelRow = typeof funnels.$inferSelect;
export class FunnelWriteError extends Error {
  constructor(public status: number, message: string, public code = "EDIT_CONFLICT") { super(message); }
}
export const editableFunnelFields = [
  "name", "description", "slug", "status", "pages", "theme", "abTests", "webhookUrl", "webhookEnabled",
  "webhookSecret", "gtmId", "metaPixelId", "metaCapiToken", "capiEnabled", "impressumUrl", "datenschutzUrl", "ogImageUrl",
] as const;
function snapshot(row: FunnelRow): FunnelDocument {
  return documentFromFunnel(row as unknown as Funnel);
}
function fingerprint(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

export async function writeFunnel(id: number, userId: number, updates: Partial<Funnel>, suppliedControl?: WriteControl, restoreId?: number, expectedUpdatedAt?: string): Promise<FunnelRow | undefined> {
  return db.transaction(async tx => {
    // Serialisiert parallele Veröffentlichungen eines Free-Accounts, ohne eine
    // Users-Zeilensperre mit FK-Prüfungen der Lead-Erfassung zu verschachteln.
    if (suppliedControl?.publish || updates.status === "published") await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`publish:${userId}`}))`);
    const [current] = await tx.select().from(funnels).where(and(eq(funnels.id, id), eq(funnels.userId, userId), sql`${funnels.deletedAt} IS NULL`)).for("update");
    if (!current) return undefined;
    if (!suppliedControl && current.editorProtocol) throw new FunnelWriteError(409, "Dieser Funnel verwendet den neuen Entwurfsschutz. Sichere offene Änderungen und lade die aktuelle Editorversion.", "EDITOR_UPDATE_REQUIRED");
    if (!suppliedControl && expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== current.updatedAt.getTime()) throw new FunnelWriteError(409, "Der Funnel wurde zwischenzeitlich geändert. Dein lokaler Entwurf bleibt erhalten.");
    // Die zuerst veröffentlichte Kompatibilitätsschicht versteht schon beide
    // Protokolle. Erst der neue Editor schaltet einen Funnel dauerhaft um.
    // Dadurch liest auch ein Code-Rollback weiterhin den richtigen Live-Stand.
    const control: WriteControl = suppliedControl ?? {
      expectedVersion: current.editVersion, documentVersion: DOCUMENT_VERSION,
      mutationId: randomUUID(), publish: (updates.status ?? current.status) === "published",
    };
    if (current.documentVersion !== DOCUMENT_VERSION || control.documentVersion !== DOCUMENT_VERSION) throw new FunnelWriteError(409, "Dieser Dokumentstand benötigt eine neuere Editorversion.", "EDITOR_UPDATE_REQUIRED");
    const digest = fingerprint({ updates, control: { expectedVersion: control.expectedVersion, documentVersion: control.documentVersion, publish: !!control.publish }, restoreId });
    const [receipt] = await tx.select().from(funnelRevisions).where(and(eq(funnelRevisions.funnelId, id), eq(funnelRevisions.mutationId, control.mutationId)));
    if (receipt && receipt.fingerprint !== digest) throw new FunnelWriteError(409, "Diese Anfrage wurde bereits mit anderem Inhalt verwendet.");
    if (receipt?.version === current.editVersion) return current;
    if (current.editVersion !== control.expectedVersion) throw new FunnelWriteError(409, "Der Funnel wurde in einer anderen Sitzung geändert. Dein lokaler Entwurf bleibt erhalten.");

    const values: Record<string, unknown> = {};
    for (const key of editableFunnelFields) if (updates[key] !== undefined) values[key] = updates[key];
    if (updates.webhookEnabled && !current.webhookSecret && !updates.webhookSecret) values.webhookSecret = randomBytes(32).toString("hex");
    if (values.status === "published" && !control.publish) throw new FunnelWriteError(400, "Bitte nutze die ausdrückliche Veröffentlichung.", "PUBLISH_REQUIRED");
    if (restoreId !== undefined) {
      const [revision] = await tx.select().from(funnelRevisions).where(and(eq(funnelRevisions.id, restoreId), eq(funnelRevisions.funnelId, id)));
      if (!revision) throw new FunnelWriteError(404, "Version nicht gefunden");
      const content = revision.content as FunnelDocument;
      if (content.version !== DOCUMENT_VERSION) throw new FunnelWriteError(409, "Diese Version kann mit diesem Editor nicht wiederhergestellt werden.");
      const { version: _, ...restored } = content;
      Object.assign(values, restored, {
        // Alte laufende Tests werden als pausierter Entwurf wiederhergestellt;
        // bestehende Messereignisse und der laufende Live-Stand bleiben bestehen.
        abTests: (content.abTests ?? []).map(test => ({ ...test, status: test.status === "running" ? "paused" : test.status })),
      });
    }
    const candidate = { ...current, ...values } as FunnelRow;
    const content = snapshot(candidate);
    if (control.publish) {
      const [owner] = await tx.select().from(users).where(and(eq(users.id, userId), sql`${users.deletedAt} IS NULL`));
      if (!owner?.emailVerifiedAt) throw new FunnelWriteError(403, "Bitte bestätige zuerst deine E-Mail-Adresse.", "EMAIL_NOT_VERIFIED");
      if (!hasProFeatures(owner) && current.status !== "published") {
        const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(funnels).where(and(eq(funnels.userId, userId), eq(funnels.status, "published"), sql`${funnels.deletedAt} IS NULL`));
        if (count >= FREE_MAX_PUBLISHED_FUNNELS) throw new FunnelWriteError(403, "Dein Free-Plan erlaubt einen veröffentlichten Funnel.", "FREE_LIMIT_REACHED");
      }
      if (!documentSchema.safeParse(content).success || !content.pages.length) throw new FunnelWriteError(400, "Bitte prüfe den Inhalt vor der Veröffentlichung.", "INVALID_DOCUMENT");
      values.status = "published";
    }
    let publishedRevisionId = current.publishedRevisionId;
    if (current.status === "published" && !publishedRevisionId) {
      await tx.insert(funnelRevisions).values({ funnelId: id, version: current.editVersion, action: "initial", content: snapshot(current), actorId: userId }).onConflictDoNothing();
      const [initial] = await tx.select({ id: funnelRevisions.id }).from(funnelRevisions).where(and(eq(funnelRevisions.funnelId, id), eq(funnelRevisions.version, current.editVersion)));
      publishedRevisionId = initial.id;
    }
    const version = current.editVersion + 1;
    const [revision] = await tx.insert(funnelRevisions).values({
      funnelId: id, version, action: restoreId !== undefined ? "restore" : control.publish ? "publish" : "draft",
      content, mutationId: control.mutationId, fingerprint: digest, actorId: userId,
    }).returning();
    await tx.execute(sql`SELECT set_config('trichterwerk.editor_protocol', '1', true)`);
    const [updated] = await tx.update(funnels).set({ ...values, editVersion: version, editorProtocol: current.editorProtocol || !!suppliedControl, updatedAt: new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1)),
      publishedRevisionId: control.publish ? revision.id : publishedRevisionId,
    }).where(eq(funnels.id, id)).returning();
    return updated;
  });
}

export async function publishedDocument(funnel: Funnel): Promise<Funnel | undefined> {
  if (funnel.status !== "published") return funnel;
  if (!funnel.publishedRevisionId) return funnel.editorProtocol ? undefined : funnel;
  const [revision] = await db.select().from(funnelRevisions).where(and(eq(funnelRevisions.id, funnel.publishedRevisionId), eq(funnelRevisions.funnelId, funnel.id)));
  if (!revision) return undefined;
  const { version, ...content } = revision.content as FunnelDocument;
  if (version !== DOCUMENT_VERSION) return undefined;
  return { ...funnel, ...content };
}

export async function listFunnelRevisions(id: number, userId: number): Promise<FunnelRevisionSummary[]> {
  const [funnel] = await db.select().from(funnels).where(and(eq(funnels.id, id), eq(funnels.userId, userId), sql`${funnels.deletedAt} IS NULL`));
  if (!funnel) throw new FunnelWriteError(404, "Funnel nicht gefunden");
  const rows = await db.select({ id: funnelRevisions.id, version: funnelRevisions.version, action: funnelRevisions.action, createdAt: funnelRevisions.createdAt,
    name: sql<string>`${funnelRevisions.content}->>'name'`,
  }).from(funnelRevisions).where(eq(funnelRevisions.funnelId, id)).orderBy(desc(funnelRevisions.version));
  return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString(), published: row.id === funnel.publishedRevisionId }));
}
