import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { E2E_DATABASE_URL } from "./helpers/env";
import { registerAndVerify, createPublishedFunnel, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";
import { makeSlug, runId } from "./helpers/unique";

test.afterAll(closePool);
test("Entwurf, Veröffentlichung und Wiederherstellung behalten Live-Inhalt und neue Leads", async ({ request, page }) => {
  const id = runId();
  await registerAndVerify(request);
  const funnel = await createPublishedFunnel(request, { name: "Live A", slug: makeSlug(id) });
  const headers = { "X-CSRF-Token": await getCsrfToken(request) };
  const controls = (expectedVersion: number, publish = false) => ({ expectedVersion, publish, documentVersion: 1, mutationId: randomUUID() });
  const owner = await (await request.get(`/api/funnels/${funnel.id}`)).json();
  const initial = owner.publishedRevisionId;
  const host = `funnel-${id}.example.test`;
  const db = new pg.Pool({ connectionString: E2E_DATABASE_URL });
  try {
    await db.query("INSERT INTO domains(funnel_id,user_id,hostname,verified,verification_token) VALUES ($1,$2,$3,true,'local-test')", [funnel.id, owner.userId, host]);
    const draftBody = { ...controls(owner.editVersion), name: "Entwurf B", webhookEnabled: true, webhookUrl: "https://example.test/webhook" };
    const saved = await request.patch(`/api/funnels/${funnel.id}`, { headers, data: draftBody });
    expect(saved.status()).toBe(200);
    // Kein Webhook auslösen; das Secret wird trotzdem serverseitig erzeugt.
    const draft = await saved.json();
    const repeat = await request.patch(`/api/funnels/${funnel.id}`, { headers, data: draftBody });
    expect(repeat.status()).toBe(200);
    expect((await repeat.json()).editVersion).toBe(draft.editVersion);
    expect((await (await page.request.get(`/api/public/funnels/${funnel.slug}`)).json()).name).toBe("Live A");
    expect((await (await request.get(`/api/funnels/${funnel.id}/preview`)).json()).name).toBe("Entwurf B");
    expect((await (await page.request.get(`/api/public/funnel-by-host?host=${host}`)).json()).name).toBe("Live A");
    const publish = await request.patch(`/api/funnels/${funnel.id}`, { headers, data: { ...controls(draft.editVersion, true), status: "published", webhookEnabled: false } });
    expect(publish.status()).toBe(200);
    const live = await publish.json();
    expect((await (await page.request.get(`/api/public/funnel-by-host?host=${host}`)).json()).name).toBe("Entwurf B");
    const lead = await page.request.post("/api/public/leads", { data: { funnelId: funnel.uuid, email: `after-${id}@example.test`, answers: { "el-email": "Antwort erhalten" } } });
    expect(lead.status()).toBe(201);
    const restored = await request.post(`/api/funnels/${funnel.id}/revisions/${initial}/restore`, { headers, data: { expectedVersion: live.editVersion, documentVersion: 1, mutationId: randomUUID() } });
    expect(restored.status()).toBe(200);
    expect((await restored.json()).name).toBe("Live A");
    expect((await (await page.request.get(`/api/public/funnels/${funnel.slug}`)).json()).name).toBe("Entwurf B");
    expect((await db.query("SELECT answers FROM leads WHERE funnel_id=$1", [funnel.id])).rows).toEqual([{ answers: { "el-email": "Antwort erhalten" } }]);
    const old = await request.patch(`/api/funnels/${funnel.id}`, { headers, data: { name: "Alter offener Tab" } });
    expect(old.status()).toBe(409);
    expect((await old.json()).code).toBe("EDITOR_UPDATE_REQUIRED");
    expect((await page.request.get(`/api/funnels/${funnel.id}/revisions`)).status()).toBe(401);
  } finally { await db.end(); }
});
