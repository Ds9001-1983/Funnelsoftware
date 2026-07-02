import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "crypto";
import { E2E_BASE_URL } from "./helpers/env";
import { findLeadsByEmail, closePool } from "./helpers/db";
import { registerAndVerify, createPublishedFunnel, type PublishedFunnel } from "./helpers/api";
import { makeSlug, runId as newRunId } from "./helpers/unique";

/**
 * Schutzmechanismen des Lead-Endpoints auf API-Ebene:
 * Honeypot (stilles Verwerfen), 30s-Dedup, 404 für unbekannte Funnels.
 */

let api: APIRequestContext;
let funnel: PublishedFunnel;
let id: string;

test.beforeAll(async () => {
  id = newRunId();
  // Eigener Request-Kontext mit Cookie-Jar (Session bleibt über Calls erhalten).
  api = await pwRequest.newContext({ baseURL: E2E_BASE_URL });
  await registerAndVerify(api);
  funnel = await createPublishedFunnel(api, {
    name: `Schutz-Funnel ${id}`,
    slug: makeSlug(`schutz-${id}`),
  });
});

test.afterAll(async () => {
  await api.dispose();
  await closePool();
});

test("Honeypot: gefülltes website-Feld → Fake-Erfolg, Lead wird verworfen", async () => {
  const email = `honeypot-${id}@example.com`;
  const res = await api.post("/api/public/leads", {
    data: {
      funnelId: funnel.uuid,
      email,
      website: "http://spam.example", // nur Bots füllen das Feld
    },
  });

  // Der Server tut so, als wäre alles gut (Bots sollen nichts lernen) …
  expect(res.status()).toBe(200);
  expect(((await res.json()) as { success: boolean }).success).toBe(true);
  // … speichert aber nichts.
  expect(await findLeadsByEmail(email)).toHaveLength(0);
});

test("Dedup: identischer Lead innerhalb 30s wird nicht doppelt angelegt", async () => {
  const email = `dedup-${id}@example.com`;
  const payload = { funnelId: funnel.uuid, email };

  const first = await api.post("/api/public/leads", { data: payload });
  expect(first.status()).toBe(201);

  const second = await api.post("/api/public/leads", { data: payload });
  expect(second.status()).toBe(200);
  expect(((await second.json()) as { deduplicated?: boolean }).deduplicated).toBe(true);

  expect(await findLeadsByEmail(email)).toHaveLength(1);
});

test("Unbekannter Funnel: Lead-Submit antwortet 404", async () => {
  const res = await api.post("/api/public/leads", {
    data: { funnelId: randomUUID(), email: `niemand-${id}@example.com` },
  });
  expect(res.status()).toBe(404);
});
