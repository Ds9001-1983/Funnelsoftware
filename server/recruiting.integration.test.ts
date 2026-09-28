// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import {
  FREE_MONTHLY_LEAD_LIMIT, funnels, leads, users, recruitingMailRules, recruitingMailJobs, leadStageEvents,
} from "@shared/schema";
import { DEFAULT_PIPELINE, type MailRuleInput } from "@shared/recruiting-contract";

const connection = process.env.RECRUITING_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search || url.hash || !["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("Recruiting integration tests require a dedicated local *_e2e database");
  }
}

describe.skipIf(!connection)("recruiting authorization, transitions and atomic outbox", () => {
  let service: typeof import("./recruiting");
  let spaces: typeof import("./workspaces");
  let database: typeof import("./db");
  let storage: (typeof import("./storage"))["storage"];
  const createdUsers: number[] = [];
  const previousConnection = process.env.DATABASE_URL;

  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    service = await import("./recruiting");
    spaces = await import("./workspaces");
    database = await import("./db");
    storage = (await import("./storage")).storage;
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
    const rows = await database.db.insert(users).values([
      { username: `rec-owner-${suffix}`, email: `rec-owner-${suffix}@example.com`, password: "fixture", isPro: true, emailVerifiedAt: new Date() },
      { username: `rec-other-${suffix}`, email: `rec-other-${suffix}@example.com`, password: "fixture", isPro: true, emailVerifiedAt: new Date() },
      { username: `rec-client-${suffix}`, email: `rec-client-${suffix}@example.com`, password: "fixture", isPro: false, trialEndsAt: null, emailVerifiedAt: new Date() },
    ]).returning();
    createdUsers.push(...rows.map((row) => row.id));
    const [owner, other, client] = rows;
    const [funnel, unsharedFunnel] = await database.db.insert(funnels).values([
      { userId: owner.id, name: "Bewerbung", status: "published" },
      { userId: owner.id, name: "Anderer Kunde" },
    ]).returning();
    const [lead, hiddenLead] = await database.db.insert(leads).values([
      { userId: owner.id, funnelId: funnel.id, name: "Ada Beispiel", email: `applicant-${suffix}@example.com` },
      { userId: owner.id, funnelId: unsharedFunnel.id, email: `hidden-${suffix}@example.com` },
    ]).returning();
    return { suffix, owner, other, client, funnel, unsharedFunnel, lead, hiddenLead };
  }

  const ruleInput = (overrides: Partial<MailRuleInput> = {}): MailRuleInput => ({
    expectedVersion: 0, trigger: "stage_entered", stageId: "lost", subject: "Deine Bewerbung bei {{funnel}}",
    body: "Hallo {{name}}, vielen Dank für deine Bewerbung.", senderName: "Recruiting-Team", enabled: true,
    ...overrides,
  });
  const jobsFor = (leadId: number) => database.db.select().from(recruitingMailJobs).where(eq(recruitingMailJobs.leadId, leadId));
  const eventsFor = (leadId: number) => database.db.select().from(leadStageEvents).where(eq(leadStageEvents.leadId, leadId));

  it("rejects foreign owner IDs across board, rules, pipeline, lead changes and history", async () => {
    const f = await fixture();
    await expect(service.getRecruitingBoard(f.funnel.id, f.other.id, true)).rejects.toMatchObject({ status: 404 });
    await expect(service.saveRecruitingRule(f.funnel.id, f.other.id, ruleInput())).rejects.toMatchObject({ status: 404 });
    await expect(service.updateRecruitingPipeline(f.funnel.id, f.other.id, 0, DEFAULT_PIPELINE)).rejects.toMatchObject({ status: 404 });
    await expect(service.getRecruitingHistory(f.lead.id, f.other.id)).rejects.toMatchObject({ status: 404 });
    await expect(service.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.other.id, stageId: "lost", expectedVersion: 0 })).rejects.toMatchObject({ status: 404 });
    expect(await eventsFor(f.lead.id)).toHaveLength(0);
  });

  it("authorizes accepted workspace clients only for assigned leads and records the actor", async () => {
    const f = await fixture();
    const workspace = await spaces.createWorkspace(f.owner.id, f.owner.email, "Kunde");
    await spaces.assignWorkspaceFunnels(workspace.id, f.owner.id, f.owner.email, [f.funnel.id]);
    const invite = await spaces.inviteWorkspaceMember(workspace.id, f.owner.id, f.owner.email, f.client.email);
    const options = { leadId: f.lead.id, ownerId: f.owner.id, actorId: f.client.id, workspaceId: workspace.id, stageId: "lost", expectedVersion: 0 };
    await expect(service.changeRecruitingStage(options)).rejects.toMatchObject({ status: 404 });
    await spaces.acceptWorkspaceInvitation(invite.id, f.client.id, f.client.email);
    await expect(service.changeRecruitingStage({ ...options, leadId: f.hiddenLead.id })).rejects.toMatchObject({ status: 404 });
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput());
    expect(await service.changeRecruitingStage(options)).toMatchObject({ stageId: "lost", stageVersion: 1 });
    expect((await eventsFor(f.lead.id))[0]).toMatchObject({ actorId: f.client.id, fromStageId: "new", toStageId: "lost" });
    expect(await jobsFor(f.lead.id)).toHaveLength(1);
    await spaces.removeWorkspaceMember(workspace.id, invite.id, f.owner.id, f.owner.email);
    await expect(service.changeRecruitingStage({ ...options, expectedVersion: 1, stageId: "new" })).rejects.toMatchObject({ status: 404 });
  });

  it("keeps accepted membership bound to the account after a verified email change", async () => {
    const f = await fixture();
    const workspace = await spaces.createWorkspace(f.owner.id, f.owner.email, "Kunde");
    await spaces.assignWorkspaceFunnels(workspace.id, f.owner.id, f.owner.email, [f.funnel.id]);
    const invite = await spaces.inviteWorkspaceMember(workspace.id, f.owner.id, f.owner.email, f.client.email);
    await spaces.acceptWorkspaceInvitation(invite.id, f.client.id, f.client.email);
    const nextEmail = `changed-${f.suffix}@example.com`;
    await database.db.update(users).set({ email: nextEmail, emailVerifiedAt: new Date() }).where(eq(users.id, f.client.id));
    expect(await spaces.getWorkspaceAccess(workspace.id, f.client.id, nextEmail)).toMatchObject({ role: "client" });
    expect(await service.changeRecruitingStage({
      leadId: f.lead.id, ownerId: f.owner.id, actorId: f.client.id,
      workspaceId: workspace.id, stageId: "contacted", expectedVersion: 0,
    })).toMatchObject({ stageVersion: 1, stageId: "contacted" });
  });

  it("serializes concurrent changes: one version, one event and one email job", async () => {
    const f = await fixture();
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput());
    const change = { leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, stageId: "lost", expectedVersion: 0 };
    const results = await Promise.allSettled([service.changeRecruitingStage(change), service.changeRecruitingStage(change)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toMatchObject({ status: 409, code: "VERSION_CONFLICT" });
    expect(await eventsFor(f.lead.id)).toHaveLength(1);
    expect(await jobsFor(f.lead.id)).toHaveLength(1);
  });

  it("does not retrigger unchanged stages and deduplicates return visits and edited rules", async () => {
    const f = await fixture();
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput());
    const base = { leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id };
    expect(await service.changeRecruitingStage({ ...base, stageId: "new", expectedVersion: 0 })).toMatchObject({ stageVersion: 0 });
    expect(await eventsFor(f.lead.id)).toHaveLength(0);
    await service.changeRecruitingStage({ ...base, stageId: "lost", expectedVersion: 0 });
    await service.changeRecruitingStage({ ...base, stageId: "lost", expectedVersion: 1 });
    expect(await eventsFor(f.lead.id)).toHaveLength(1);
    await service.changeRecruitingStage({ ...base, stageId: "new", expectedVersion: 1 });
    expect((await jobsFor(f.lead.id))[0]).toMatchObject({ status: "cancelled", errorCode: "STATUS_CHANGED" });
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput({ expectedVersion: 1, body: "Neue Vorlage" }));
    await service.changeRecruitingStage({ ...base, stageId: "lost", expectedVersion: 2 });
    expect(await jobsFor(f.lead.id)).toHaveLength(1);
  });

  it("rolls a stage update back if its history cannot be persisted", async () => {
    const f = await fixture();
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput());
    await database.db.insert(leadStageEvents).values({ leadId: f.lead.id, actorId: f.owner.id, fromStageId: "new", toStageId: "contacted", version: 1 });
    await expect(service.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, stageId: "lost", expectedVersion: 0 })).rejects.toBeDefined();
    const [lead] = await database.db.select().from(leads).where(eq(leads.id, f.lead.id));
    expect(lead).toMatchObject({ status: "new", stageId: null, stageVersion: 0 });
    expect(await jobsFor(f.lead.id)).toHaveLength(0);
  });

  it("rejects stale pipeline/rule edits and protects occupied or referenced stages", async () => {
    const f = await fixture();
    const renamed = DEFAULT_PIPELINE.map((stage) => ({ ...stage, name: stage.id === "lost" ? "Abgesagt" : stage.name }));
    expect(await service.updateRecruitingPipeline(f.funnel.id, f.owner.id, 0, renamed)).toMatchObject({ version: 1 });
    await expect(service.updateRecruitingPipeline(f.funnel.id, f.owner.id, 0, DEFAULT_PIPELINE)).rejects.toMatchObject({ status: 409 });
    await expect(service.updateRecruitingPipeline(f.funnel.id, f.owner.id, 1, renamed.filter((stage) => stage.id !== "new"))).rejects.toMatchObject({ status: 409 });
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput());
    await expect(service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput())).rejects.toMatchObject({ status: 409 });
    await expect(service.updateRecruitingPipeline(f.funnel.id, f.owner.id, 1, renamed.filter((stage) => stage.id !== "lost"))).rejects.toMatchObject({ status: 409 });
    expect((await service.getRecruitingBoard(f.funnel.id, f.owner.id, true)).pipeline.version).toBe(1);
  });

  it("enabling a rule sends no historical emails and disabling cancels pending jobs", async () => {
    const f = await fixture();
    await service.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, stageId: "lost", expectedVersion: 0 });
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput());
    expect(await jobsFor(f.lead.id)).toHaveLength(0);
    await service.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, stageId: "new", expectedVersion: 1 });
    await service.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, stageId: "lost", expectedVersion: 2 });
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput({ expectedVersion: 1, enabled: false }));
    expect((await jobsFor(f.lead.id))[0]).toMatchObject({ status: "cancelled", errorCode: "RULE_DISABLED" });
  });

  it("normalizes public initial status and atomically deduplicates confirmation jobs", async () => {
    const f = await fixture();
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput({ trigger: "created", stageId: null }));
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput());
    const applicantEmail = `dedup-${f.suffix}@example.com`;
    const input = { funnelId: f.funnel.id, email: applicantEmail, name: "Doppelklick", status: "lost" as const };
    const [first, second] = await Promise.all([storage.createLead(input, f.owner.id), storage.createLead(input, f.owner.id)]);
    expect(first.id).toBe(second.id);
    expect(first.status).toBe("new");
    const jobs = await jobsFor(first.id);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ stageId: null, recipient: applicantEmail, replyTo: f.owner.email });
    const [funnel] = await database.db.select().from(funnels).where(eq(funnels.id, f.funnel.id));
    expect(funnel.leads).toBe(1);
  });

  it("does not queue mail for missing email, unverified owners or Free owners", async () => {
    const f = await fixture();
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput({ trigger: "created", stageId: null }));
    const missingEmail = await storage.createLead({ funnelId: f.funnel.id, name: "Ohne Mail", status: "new" }, f.owner.id);
    expect(await jobsFor(missingEmail.id)).toHaveLength(0);
    await database.db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, f.owner.id));
    const unverified = await storage.createLead({ funnelId: f.funnel.id, email: `unverified-${f.suffix}@example.com`, status: "new" }, f.owner.id);
    expect(await jobsFor(unverified.id)).toHaveLength(0);
    await database.db.update(users).set({ emailVerifiedAt: new Date(), isPro: false, trialEndsAt: null }).where(eq(users.id, f.owner.id));
    const free = await storage.createLead({ funnelId: f.funnel.id, email: `free-${f.suffix}@example.com`, status: "new" }, f.owner.id);
    expect(await jobsFor(free.id)).toHaveLength(0);
  });

  it("applies Free limits across the entire owner account to board, mutations and history", async () => {
    const f = await fixture();
    const earlier = new Date(); earlier.setUTCDate(1); earlier.setUTCHours(0, 0, 0, 0);
    await database.db.insert(leads).values(Array.from({ length: FREE_MONTHLY_LEAD_LIMIT }, (_, index) => ({
      userId: f.owner.id, funnelId: f.unsharedFunnel.id, email: `earlier-${index}-${f.suffix}@example.com`, createdAt: earlier,
    })));
    await database.db.update(users).set({ isPro: false, trialEndsAt: null }).where(eq(users.id, f.owner.id));
    const board = await service.getRecruitingBoard(f.funnel.id, f.owner.id, true);
    expect(board.leads[0]).toMatchObject({ id: f.lead.id, locked: true, name: null, email: null });
    await expect(service.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, stageId: "lost", expectedVersion: 0 })).rejects.toMatchObject({ status: 403 });
    await expect(service.getRecruitingHistory(f.lead.id, f.owner.id)).rejects.toMatchObject({ status: 403 });
  });

  it("removes outbox content and status history when an applicant is erased", async () => {
    const f = await fixture();
    await service.saveRecruitingRule(f.funnel.id, f.owner.id, ruleInput());
    await service.changeRecruitingStage({ leadId: f.lead.id, ownerId: f.owner.id, actorId: f.owner.id, stageId: "lost", expectedVersion: 0 });
    expect(await jobsFor(f.lead.id)).toHaveLength(1);
    await storage.deleteLeadsByEmail(f.owner.id, f.lead.email!);
    expect(await jobsFor(f.lead.id)).toHaveLength(0);
    expect(await eventsFor(f.lead.id)).toHaveLength(0);
    expect(await database.db.select().from(recruitingMailRules).where(eq(recruitingMailRules.funnelId, f.funnel.id))).toHaveLength(1);
  });
});
