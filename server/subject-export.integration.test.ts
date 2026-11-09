// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { users, funnels, leads, leadStageEvents, recruitingMailJobs, recruitingMailRules, funnelRecruitingConfigs } from "@shared/schema";

const connection = process.env.SUBJECT_EXPORT_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname)
    || !["postgres:", "postgresql:"].includes(url.protocol) || url.search || url.hash) {
    throw new Error("Subject export tests require a dedicated local *_e2e database");
  }
}

describe.skipIf(!connection)("subject export ownership and completeness", () => {
  let database: typeof import("./db");
  let exportSubjectData: (typeof import("./subject-export"))["exportSubjectData"];
  const createdUsers: number[] = [];
  const previousConnection = process.env.DATABASE_URL;

  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    database = await import("./db");
    ({ exportSubjectData } = await import("./subject-export"));
  });
  afterAll(async () => {
    if (database) {
      if (createdUsers.length) await database.db.delete(users).where(inArray(users.id, createdUsers));
      await database.pool.end();
    }
    if (previousConnection === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousConnection;
  });

  async function fixture() {
    const suffix = randomUUID();
    const [owner, other] = await database.db.insert(users).values(["owner", "other"].map(role => ({
      username: `export-${role}-${suffix}`, email: `${role}-${suffix}@example.test`,
      password: "private-password-hash", emailVerificationToken: "private-verification-token",
      isPro: false, trialEndsAt: null, subscriptionStatus: "free", emailVerifiedAt: new Date(),
    }))).returning();
    createdUsers.push(owner.id, other.id);
    const [funnel, foreignFunnel] = await database.db.insert(funnels).values([
      { userId: owner.id, name: "Bewerbung" }, { userId: other.id, name: "Fremder Kunde" },
    ]).returning();
    const [rule] = await database.db.insert(recruitingMailRules).values({
      funnelId: funnel.id, ruleKey: "received", trigger: "received",
      subject: "Vorlage", body: "Nicht gerenderte Vorlage", senderName: "Recruiting",
    }).returning();
    const email = `applicant-${suffix}@example.test`;
    const [lead] = await database.db.insert(leads).values({
      userId: owner.id, funnelId: funnel.id, email, name: "Ada Beispiel",
      answers: { experience: "Fünf Jahre" },
      answerSnapshot: {
        version: 1, documentVersion: 3, contentRevisionId: 1, path: ["experience"],
        fields: [{ pageId: "experience", elementId: "years", label: "Erfahrung", value: "Fünf Jahre" }],
      },
      marketingConsent: true, consentVersion: "test-consent", consentAt: new Date(),
    }).returning();
    return { owner, other, funnel, foreignFunnel, rule, lead, email };
  }
  async function job(f: Awaited<ReturnType<typeof fixture>>, overrides: Partial<typeof recruitingMailJobs.$inferInsert> = {}) {
    const [row] = await database.db.insert(recruitingMailJobs).values({
      leadId: f.lead.id, ruleId: f.rule.id, ownerId: f.owner.id,
      recipient: f.email, replyTo: "recruiting@example.test", senderName: "Recruiting",
      subject: "Rückmeldung an Ada", body: "Hallo Ada, vielen Dank für deine Bewerbung.",
      status: "sent", attempts: 1, sentAt: new Date(), messageId: "synthetic-message",
      ...overrides,
    }).returning();
    return row;
  }

  it("includes stored answers, consent, stage history and full email content for a Free account", async () => {
    const f = await fixture();
    await database.db.insert(funnelRecruitingConfigs).values({
      funnelId: f.funnel.id, stages: [{ id: "lost", name: "Absage", color: "#ff0000", legacyStatus: "lost" }],
    });
    const [event] = await database.db.insert(leadStageEvents).values({
      leadId: f.lead.id, actorId: f.owner.id, fromStageId: "new", toStageId: "lost", version: 1,
    }).returning();
    const mail = await job(f);
    const result = JSON.parse(JSON.stringify(await exportSubjectData(f.owner.id, f.email)));
    expect(result).toMatchObject({
      schemaVersion: 2, count: 1, email: f.email,
      leads: [{
        id: f.lead.id, name: "Ada Beispiel", answers: { experience: "Fünf Jahre" },
        answerSnapshot: f.lead.answerSnapshot, marketingConsent: true, consentVersion: "test-consent",
        currentRecruitingStages: [{ id: "lost", name: "Absage" }],
      }],
      recruiting: {
        stageEvents: [{ id: event.id, actorId: f.owner.id, fromStageId: "new", toStageId: "lost", version: 1 }],
        mailJobs: [{ id: mail.id, subject: mail.subject, body: mail.body, recipient: f.email,
          replyTo: mail.replyTo, senderName: mail.senderName, status: "sent", attempts: 1, messageId: "synthetic-message" }],
      },
    });
    expect(result.leads[0].createdAt).toBe(f.lead.createdAt.toISOString());
    expect(result.recruiting.mailJobs[0].sentAt).toBe(mail.sentAt?.toISOString());
    expect(JSON.stringify(result)).not.toContain("private-password-hash");
    expect(JSON.stringify(result)).not.toContain("private-verification-token");
    expect(JSON.stringify(result)).not.toContain(f.owner.email);
  });

  it("includes soft-deleted funnels, normalizes email whitespace/case and leaves data unchanged", async () => {
    const f = await fixture();
    const deletedAt = new Date();
    await database.db.update(funnels).set({ deletedAt }).where(eq(funnels.id, f.funnel.id));
    await database.db.update(leads).set({ email: ` ${f.email.toUpperCase()} ` }).where(eq(leads.id, f.lead.id));
    const result = await exportSubjectData(f.owner.id, `  ${f.email}  `);
    expect(result.count).toBe(1);
    expect(result.leads[0].funnelDeletedAt).toEqual(deletedAt);
    expect(result.leads[0].currentRecruitingStages).toEqual(expect.arrayContaining([expect.objectContaining({ id: "new" })]));
    expect(await database.db.select().from(funnelRecruitingConfigs).where(eq(funnelRecruitingConfigs.funnelId, f.funnel.id))).toHaveLength(0);
    expect(await database.db.select().from(leads).where(eq(leads.id, f.lead.id))).toHaveLength(1);
  });

  it("isolates the same email across owners and rejects inconsistent lead/funnel/job ownership", async () => {
    const f = await fixture();
    await database.db.insert(leads).values([
      { userId: f.other.id, funnelId: f.foreignFunnel.id, email: f.email, message: "foreign-private" },
      { userId: f.owner.id, funnelId: f.foreignFunnel.id, email: f.email, message: "inconsistent-private" },
    ]);
    await job(f, { ownerId: f.other.id, body: "foreign-job-private" });
    const result = await exportSubjectData(f.owner.id, f.email);
    expect(result.leads.map(lead => lead.id)).toEqual([f.lead.id]);
    expect(result.recruiting.mailJobs).toEqual([]);
    expect(JSON.stringify(result)).not.toContain("-private");
    expect((await exportSubjectData(f.other.id, f.email)).leads).toHaveLength(1);
  });

  it("finds a historic recipient without exporting the lead's changed contact or unrelated history", async () => {
    const f = await fixture();
    const mail = await job(f, { recipient: ` ${f.email.toUpperCase()} `, status: "uncertain", errorCode: "processing_lease_expired" });
    await database.db.update(leads).set({ email: "new-address@example.test", message: "new-contact-private" }).where(eq(leads.id, f.lead.id));
    await database.db.insert(leadStageEvents).values({ leadId: f.lead.id, fromStageId: "new", toStageId: "lost", version: 1 });
    const result = await exportSubjectData(f.owner.id, f.email);
    expect(result.count).toBe(0);
    expect(result.leads).toEqual([]);
    expect(result.recruiting.stageEvents).toEqual([]);
    expect(result.recruiting.mailJobs).toMatchObject([{ id: mail.id, status: "uncertain", errorCode: "processing_lease_expired" }]);
    expect(JSON.stringify(result)).not.toContain("new-address@example.test");
    expect(JSON.stringify(result)).not.toContain("new-contact-private");
  });

  it("includes pending and cancelled messages, and does not infer identity from free text", async () => {
    const f = await fixture();
    await job(f, { status: "cancelled", sentAt: null, attempts: 0 });
    const [secondRule] = await database.db.insert(recruitingMailRules).values({
      funnelId: f.funnel.id, ruleKey: "stage:lost", trigger: "stage_entered", stageId: "lost",
      subject: "Andere Vorlage", body: "Andere Vorlage", senderName: "Recruiting",
    }).returning();
    await job(f, { ruleId: secondRule.id, status: "pending", sentAt: null, attempts: 0 });
    expect((await exportSubjectData(f.owner.id, f.email)).recruiting.mailJobs.map(row => row.status)).toEqual(["cancelled", "pending"]);
    await database.db.update(leads).set({ email: "unrelated@example.test", answers: { mentions: f.email } }).where(eq(leads.id, f.lead.id));
    await database.db.update(recruitingMailJobs).set({ recipient: "unrelated@example.test" }).where(eq(recruitingMailJobs.leadId, f.lead.id));
    const result = await exportSubjectData(f.owner.id, f.email);
    expect(result).toMatchObject({ count: 0, leads: [], recruiting: { stageEvents: [], mailJobs: [] } });
  });

  it("returns an explicit empty result for missing subjects or foreign account IDs", async () => {
    const f = await fixture();
    for (const [ownerId, email] of [[f.owner.id, "missing@example.test"], [f.other.id, f.email]] as const) {
      const result = await exportSubjectData(ownerId, email);
      expect(result).toMatchObject({ schemaVersion: 2, count: 0, leads: [], recruiting: { stageEvents: [], mailJobs: [] } });
      expect(result.scope.manualReview.length).toBeGreaterThan(0);
    }
  });

  it("uses the same email normalization for erasure and removes history and jobs only for the owner", async () => {
    const f = await fixture();
    await job(f);
    await database.db.update(leads).set({ email: ` ${f.email.toUpperCase()} ` }).where(eq(leads.id, f.lead.id));
    await database.db.insert(leadStageEvents).values({ leadId: f.lead.id, fromStageId: "new", toStageId: "lost", version: 1 });
    const [foreign] = await database.db.insert(leads).values({
      userId: f.other.id, funnelId: f.foreignFunnel.id, email: f.email,
    }).returning();
    const { storage } = await import("./storage");
    expect(await storage.getLeadsByEmail(f.owner.id, f.email)).toHaveLength(1);
    expect(await storage.deleteLeadsByEmail(f.owner.id, ` ${f.email} `)).toBe(1);
    expect((await exportSubjectData(f.owner.id, f.email))).toMatchObject({
      count: 0, leads: [], recruiting: { stageEvents: [], mailJobs: [] },
    });
    expect(await database.db.select().from(leads).where(eq(leads.id, foreign.id))).toHaveLength(1);
    expect(await storage.deleteLeadsByEmail(f.owner.id, f.email)).toBe(0);
  });
});
