import type { APIRequestContext } from "@playwright/test";
import { getVerificationToken } from "./db";
import { makeCredentials, type TestCredentials } from "./unique";

/**
 * API-Helfer für Specs, die keinen Browser brauchen (Lead-Schutz etc.).
 * Der übergebene APIRequestContext hält Session-Cookies (connect.sid) selbst.
 */

/** Registriert einen User und verifiziert die E-Mail über den echten Endpoint. */
export async function registerAndVerify(
  request: APIRequestContext,
  creds: TestCredentials = makeCredentials(),
): Promise<TestCredentials> {
  const res = await request.post("/api/auth/register", {
    data: {
      username: creds.username,
      email: creds.email,
      password: creds.password,
    },
  });
  if (res.status() !== 201) {
    throw new Error(`Registrierung fehlgeschlagen (${res.status()}): ${await res.text()}`);
  }

  // Ohne SMTP existiert der Token nur in der DB — echten Verify-Endpoint treffen,
  // damit der Produktions-Pfad (Token-Verbrauch) mitgetestet wird.
  const token = await getVerificationToken(creds.email);
  const verify = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  if (!verify.ok()) {
    throw new Error(`E-Mail-Verifikation fehlgeschlagen (${verify.status()})`);
  }
  return creds;
}

/** Holt das CSRF-Token für zustandsändernde, authentifizierte API-Calls. */
export async function getCsrfToken(request: APIRequestContext): Promise<string> {
  const res = await request.get("/api/auth/csrf-token");
  const body = (await res.json()) as { csrfToken: string };
  return body.csrfToken;
}

export interface PublishedFunnel {
  id: number;
  uuid: string;
  slug: string;
}

/** Erstellt und publiziert einen minimalen Funnel (welcome → contact → thankyou). */
export async function createPublishedFunnel(
  request: APIRequestContext,
  { name, slug }: { name: string; slug: string },
): Promise<PublishedFunnel> {
  const csrf = await getCsrfToken(request);
  const headers = { "X-CSRF-Token": csrf };

  const createRes = await request.post("/api/funnels", {
    headers,
    data: {
      name,
      pages: [
        { id: "page-1", type: "welcome", title: "Willkommen", elements: [], buttonText: "Los" },
        {
          id: "page-2",
          type: "contact",
          title: "Kontakt",
          elements: [
            { id: "el-email", type: "input", placeholder: "Deine E-Mail", required: true, mapToLeadField: "email" },
          ],
          buttonText: "Absenden",
        },
        { id: "page-3", type: "thankyou", title: "Danke!", elements: [] },
      ],
    },
  });
  if (createRes.status() !== 201) {
    throw new Error(`Funnel-Erstellung fehlgeschlagen (${createRes.status()}): ${await createRes.text()}`);
  }
  const funnel = (await createRes.json()) as { id: number; uuid: string };

  const publishRes = await request.patch(`/api/funnels/${funnel.id}`, {
    headers,
    data: { status: "published", slug },
  });
  if (publishRes.status() !== 200) {
    throw new Error(`Publish fehlgeschlagen (${publishRes.status()}): ${await publishRes.text()}`);
  }
  const published = (await publishRes.json()) as { slug: string };

  return { id: funnel.id, uuid: funnel.uuid, slug: published.slug };
}
