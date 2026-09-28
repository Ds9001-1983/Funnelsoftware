// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { funnels, leads, users, workspaceFunnels, workspaceMembers, workspaces } from "@shared/schema";

// Never infer a connection from DATABASE_URL or a project .env file.
const connection = process.env.WORKSPACE_TEST_DATABASE_URL;
if (connection) {
  const url = new URL(connection);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || !/^\/funnelsoftware_e2e(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search || url.hash || !["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("Workspace integration tests require a dedicated local *_e2e database");
  }
}

describe.skipIf(!connection)("workspace access and persistence", () => {
  let api: typeof import("./workspaces");
  let database: typeof import("./db");
  const createdUsers: number[] = [];
  const previousConnection = process.env.DATABASE_URL;

  beforeAll(async () => {
    process.env.DATABASE_URL = connection;
    api = await import("./workspaces");
    database = await import("./db");
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
      { username: `agency-${suffix}`, email: `agency-${suffix}@example.com`, password: "fixture", isPro: true, emailVerifiedAt: new Date() },
      { username: `client-${suffix}`, email: `client-${suffix}@example.com`, password: "fixture", isPro: false, trialEndsAt: null, emailVerifiedAt: new Date() },
      { username: `other-${suffix}`, email: `other-${suffix}@example.com`, password: "fixture", isPro: true, emailVerifiedAt: new Date() },
      { username: `pending-${suffix}`, email: `pending-${suffix}@example.com`, password: "fixture", emailVerifiedAt: null },
    ]).returning();
    createdUsers.push(...rows.map((row) => row.id));
    const [owner, client, other, unverified] = rows;
    const [funnel, unrelated, foreign] = await database.db.insert(funnels).values([
      { userId: owner.id, name: "Freigegeben", webhookSecret: "secret-webhook", metaCapiToken: "secret-capi" },
      { userId: owner.id, name: "Nicht freigegeben" },
      { userId: other.id, name: "Andere Agentur" },
    ]).returning();
    const [lead, hiddenLead] = await database.db.insert(leads).values([
      { userId: owner.id, funnelId: funnel.id, email: `visible-${suffix}@example.com` },
      { userId: owner.id, funnelId: unrelated.id, email: `hidden-${suffix}@example.com` },
    ]).returning();
    const workspace = await api.createWorkspace(owner.id, owner.email, "Kunde");
    await api.assignWorkspaceFunnels(workspace.id, owner.id, owner.email, [funnel.id]);
    const invite = await api.inviteWorkspaceMember(workspace.id, owner.id, owner.email, client.email);
    return { owner, client, other, unverified, funnel, unrelated, foreign, lead, hiddenLead, workspace, invite };
  }

  it("keeps existing users pending until verified explicit acceptance; a client's own Free plan is irrelevant", async () => {
    const f = await fixture();
    expect(f.invite.userId).toBeNull();
    expect(f.invite.acceptedAt).toBeNull();
    expect(await api.listWorkspaces(f.client.id, f.client.email)).toEqual([]);
    await expect(api.getWorkspaceLeads(f.workspace.id, f.client.id, f.client.email)).rejects.toMatchObject({ status: 404 });
    expect(await api.listWorkspaceInvitations(f.client.id, f.client.email)).toHaveLength(1);
    const accepted = await api.acceptWorkspaceInvitation(f.invite.id, f.client.id, f.client.email);
    expect(accepted).toMatchObject({ role: "client", ownerPlan: "pro", canChangeStatus: true, canManage: false });
    expect(await api.getWorkspaceLeads(f.workspace.id, f.client.id, f.client.email)).toHaveLength(1);
  });

  it("blocks unverified invitations and mismatched email identities", async () => {
    const f = await fixture();
    const invite = await api.inviteWorkspaceMember(f.workspace.id, f.owner.id, f.owner.email, f.unverified.email);
    await expect(api.acceptWorkspaceInvitation(invite.id, f.unverified.id, f.unverified.email)).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
    await expect(api.acceptWorkspaceInvitation(f.invite.id, f.other.id, f.other.email)).rejects.toMatchObject({ status: 404 });
    await expect(api.acceptWorkspaceInvitation(f.invite.id, f.other.id, f.client.email)).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  });

  it("scopes lead details and safe funnel DTOs and denies client management", async () => {
    const f = await fixture();
    await api.acceptWorkspaceInvitation(f.invite.id, f.client.id, f.client.email);
    expect(await api.getWorkspaceFunnels(f.workspace.id, f.client.id, f.client.email)).toEqual([
      { id: f.funnel.id, name: f.funnel.name, status: "draft" },
    ]);
    await expect(api.getWorkspaceLeads(f.workspace.id, f.client.id, f.client.email, f.hiddenLead.id)).rejects.toMatchObject({ status: 404 });
    await expect(api.getWorkspaceLeads(f.workspace.id, f.other.id, f.other.email, f.lead.id)).rejects.toMatchObject({ status: 404 });
    await expect(api.listWorkspaceMembers(f.workspace.id, f.client.id, f.client.email)).rejects.toMatchObject({ status: 404 });
    await expect(api.assignWorkspaceFunnels(f.workspace.id, f.client.id, f.client.email, [])).rejects.toMatchObject({ status: 404 });
    await expect(api.deleteWorkspace(f.workspace.id, f.client.id, f.client.email)).rejects.toMatchObject({ status: 404 });
  });

  it("validates every assignment before replacing current resources and rejects cross-workspace sharing", async () => {
    const f = await fixture();
    await expect(api.assignWorkspaceFunnels(f.workspace.id, f.owner.id, f.owner.email, [f.funnel.id, f.foreign.id])).rejects.toMatchObject({ status: 404 });
    expect(await api.getWorkspaceFunnels(f.workspace.id, f.owner.id, f.owner.email)).toHaveLength(1);
    const second = await api.createWorkspace(f.owner.id, f.owner.email, "Zweiter Kunde");
    await expect(api.assignWorkspaceFunnels(second.id, f.owner.id, f.owner.email, [f.funnel.id])).rejects.toMatchObject({ status: 409 });
  });

  it("serializes competing assignments so a funnel never belongs to two customers", async () => {
    const f = await fixture();
    const second = await api.createWorkspace(f.owner.id, f.owner.email, "Zweiter Kunde");
    const outcomes = await Promise.allSettled([
      api.assignWorkspaceFunnels(f.workspace.id, f.owner.id, f.owner.email, [f.unrelated.id]),
      api.assignWorkspaceFunnels(second.id, f.owner.id, f.owner.email, [f.unrelated.id]),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find((outcome) => outcome.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toMatchObject({ status: 409 });
    expect(await database.db.select().from(workspaceFunnels).where(eq(workspaceFunnels.funnelId, f.unrelated.id))).toHaveLength(1);
  });

  it("keeps revocation final when invitation acceptance races with it", async () => {
    const f = await fixture();
    const outcomes = await Promise.allSettled([
      api.acceptWorkspaceInvitation(f.invite.id, f.client.id, f.client.email),
      api.removeWorkspaceMember(f.workspace.id, f.invite.id, f.owner.id, f.owner.email),
    ]);
    expect(outcomes[1].status).toBe("fulfilled");
    await expect(api.getWorkspaceAccess(f.workspace.id, f.client.id, f.client.email)).rejects.toMatchObject({ status: 404 });
    expect(await database.db.select().from(workspaceMembers).where(eq(workspaceMembers.id, f.invite.id))).toHaveLength(0);
  });

  it("revokes access on the following request and excludes soft-deleted funnels", async () => {
    const f = await fixture();
    await api.acceptWorkspaceInvitation(f.invite.id, f.client.id, f.client.email);
    await database.db.update(funnels).set({ deletedAt: new Date() }).where(eq(funnels.id, f.funnel.id));
    expect(await api.getWorkspaceLeads(f.workspace.id, f.client.id, f.client.email)).toEqual([]);
    await expect(api.getWorkspaceFunnelAccess(f.workspace.id, f.funnel.id, f.client.id, f.client.email)).rejects.toMatchObject({ status: 404 });
    await database.db.update(funnels).set({ deletedAt: null }).where(eq(funnels.id, f.funnel.id));
    await api.removeWorkspaceMember(f.workspace.id, f.invite.id, f.owner.id, f.owner.email);
    await expect(api.getWorkspaceLeads(f.workspace.id, f.client.id, f.client.email)).rejects.toMatchObject({ status: 404 });
    await expect(api.acceptWorkspaceInvitation(f.invite.id, f.client.id, f.client.email)).rejects.toMatchObject({ status: 404 });
  });

  it("rechecks the verified identity after an account changes its email", async () => {
    const f = await fixture();
    await api.acceptWorkspaceInvitation(f.invite.id, f.client.id, f.client.email);
    await database.db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, f.client.id));
    await expect(api.getWorkspaceLeads(f.workspace.id, f.client.id, f.client.email)).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  });

  it("pauses client reads on agency downgrade while keeping revocation available", async () => {
    const f = await fixture();
    await api.acceptWorkspaceInvitation(f.invite.id, f.client.id, f.client.email);
    await database.db.update(users).set({ isPro: false, trialEndsAt: null }).where(eq(users.id, f.owner.id));
    await expect(api.getWorkspaceLeads(f.workspace.id, f.client.id, f.client.email)).rejects.toMatchObject({ code: "WORKSPACE_PAUSED" });
    await expect(api.assignWorkspaceFunnels(f.workspace.id, f.owner.id, f.owner.email, [f.unrelated.id])).rejects.toMatchObject({ code: "PRO_REQUIRED" });
    await api.assignWorkspaceFunnels(f.workspace.id, f.owner.id, f.owner.email, []);
    await api.removeWorkspaceMember(f.workspace.id, f.invite.id, f.owner.id, f.owner.email);
    await api.deleteWorkspace(f.workspace.id, f.owner.id, f.owner.email);
  });

  it("preserves agency resources when a client account or workspace is deleted", async () => {
    const f = await fixture();
    await api.acceptWorkspaceInvitation(f.invite.id, f.client.id, f.client.email);
    await database.db.delete(users).where(eq(users.id, f.client.id));
    expect(await database.db.select().from(workspaceMembers).where(eq(workspaceMembers.id, f.invite.id))).toHaveLength(0);
    expect(await database.db.select().from(leads).where(eq(leads.id, f.lead.id))).toHaveLength(1);
    await api.deleteWorkspace(f.workspace.id, f.owner.id, f.owner.email);
    expect(await database.db.select().from(workspaceFunnels).where(eq(workspaceFunnels.workspaceId, f.workspace.id))).toHaveLength(0);
    expect(await database.db.select().from(funnels).where(eq(funnels.id, f.funnel.id))).toHaveLength(1);
    expect(await database.db.select().from(leads).where(eq(leads.id, f.lead.id))).toHaveLength(1);
  });

  it("cleans owned workspaces and shares when the agency account is deleted", async () => {
    const f = await fixture();
    await database.db.delete(users).where(eq(users.id, f.owner.id));
    expect(await database.db.select().from(workspaces).where(eq(workspaces.id, f.workspace.id))).toHaveLength(0);
    expect(await database.db.select().from(workspaceMembers).where(eq(workspaceMembers.id, f.invite.id))).toHaveLength(0);
    expect(await database.db.select().from(workspaceFunnels).where(eq(workspaceFunnels.workspaceId, f.workspace.id))).toHaveLength(0);
    expect(await database.db.select().from(users).where(eq(users.id, f.client.id))).toHaveLength(1);
  });
});
