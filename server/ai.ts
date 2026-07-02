import { aiFunnelOutputSchema, type AiFunnelOutput, type GenerateFunnelInput } from "@shared/schema";

// KI-Funnel-Generierung über den vom Kunden hinterlegten Provider (BYOK).
// Native fetch (Node 18+), keine SDK-Dependency.

export interface DecryptedCredential {
  provider: "anthropic" | "openai" | "openai-compatible";
  model: string;
  baseUrl?: string | null;
  apiKey: string;
}

/** Fehler mit stabilem Code fürs Frontend (Provider-Rohtext wird NIE durchgereicht). */
export class AiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const GEN_TIMEOUT_MS = 45_000;
const TEST_TIMEOUT_MS = 12_000;

// Nur Element-Typen, die im öffentlichen Funnel zuverlässig rendern (kein "quiz" = WIP).
const ALLOWED_ELEMENT_TYPES = new Set([
  "heading", "text", "image", "button", "input", "textarea", "radio", "select",
  "checkbox", "list", "video", "timer", "divider", "spacer", "progressBar",
]);

function assertSafeBaseUrl(baseUrl: string) {
  let u: URL;
  try {
    u = new URL(baseUrl);
  } catch {
    throw new AiError("AI_PROVIDER_ERROR", "Ungültige Base-URL.");
  }
  if (u.protocol !== "https:") throw new AiError("AI_PROVIDER_ERROR", "Base-URL muss https sein.");
  const host = u.hostname;
  if (
    host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1" ||
    /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new AiError("AI_PROVIDER_ERROR", "Base-URL darf nicht auf ein internes Netz zeigen.");
  }
}

async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") throw new AiError("AI_PROVIDER_ERROR", "Zeitüberschreitung beim KI-Anbieter.");
    throw new AiError("AI_PROVIDER_ERROR", "KI-Anbieter nicht erreichbar.");
  } finally {
    clearTimeout(t);
  }
}

function mapHttpError(status: number): AiError {
  if (status === 401 || status === 403) return new AiError("AI_KEY_INVALID", "Der API-Key wurde vom Anbieter abgelehnt.");
  if (status === 402 || status === 429) return new AiError("AI_PROVIDER_QUOTA", "Kontingent/Rate-Limit deines KI-Anbieters erreicht.");
  return new AiError("AI_PROVIDER_ERROR", `KI-Anbieter antwortete mit einem Fehler (HTTP ${status}).`);
}

async function callAnthropic(cred: DecryptedCredential, system: string, user: string, maxTokens: number, timeoutMs: number): Promise<string> {
  const res = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cred.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: cred.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    },
    timeoutMs,
  );
  if (!res.ok) throw mapHttpError(res.status);
  const data: any = await res.json();
  return Array.isArray(data?.content) ? data.content.map((c: any) => c?.text || "").join("") : "";
}

async function callOpenAiCompatible(cred: DecryptedCredential, system: string, user: string, maxTokens: number, timeoutMs: number): Promise<string> {
  let base = "https://api.openai.com/v1";
  if (cred.provider === "openai-compatible" && cred.baseUrl) {
    assertSafeBaseUrl(cred.baseUrl);
    base = cred.baseUrl.replace(/\/+$/, "");
  }
  const res = await fetchWithTimeout(
    `${base}/chat/completions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cred.apiKey}`,
      },
      body: JSON.stringify({
        model: cred.model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    },
    timeoutMs,
  );
  if (!res.ok) throw mapHttpError(res.status);
  const data: any = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function chatJson(cred: DecryptedCredential, system: string, user: string, maxTokens: number, timeoutMs: number): Promise<string> {
  if (cred.provider === "anthropic") return callAnthropic(cred, system, user, maxTokens, timeoutMs);
  return callOpenAiCompatible(cred, system, user, maxTokens, timeoutMs);
}

/** Billiger Verbindungstest — validiert Key + Erreichbarkeit. */
export async function testConnection(cred: DecryptedCredential): Promise<void> {
  await chatJson(cred, 'Antworte nur mit dem JSON {"ok":true}.', "ping", 16, TEST_TIMEOUT_MS);
}

function extractJson(raw: string): any {
  let s = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AiError("AI_INVALID_OUTPUT", "Keine JSON-Struktur in der KI-Antwort.");
  }
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    throw new AiError("AI_INVALID_OUTPUT", "KI-Antwort ist kein gültiges JSON.");
  }
}

// Unbekannte/riskante Element-Typen defensiv auf "text" mappen (falls das Modell abweicht).
function sanitizeOutput(obj: any): any {
  if (obj?.pages && Array.isArray(obj.pages)) {
    for (const page of obj.pages) {
      if (Array.isArray(page?.elements)) {
        for (const el of page.elements) {
          if (el && typeof el.type === "string" && !ALLOWED_ELEMENT_TYPES.has(el.type)) {
            el.type = "text";
          }
        }
      }
    }
  }
  return obj;
}

const SYSTEM_PROMPT = `Du bist ein erfahrener Funnel-Copywriter und Konversions-Experte. Du erzeugst mehrstufige Marketing-Funnels als striktes JSON auf Deutsch.

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt dieser Form (keine Erklärungen, kein Markdown):
{
  "pages": [ {
    "id": "eindeutige-id, z.B. page-1",
    "type": "welcome | question | multiChoice | contact | calendar | thankyou",
    "title": "Überschrift der Seite",
    "subtitle": "optional",
    "buttonText": "Text des Weiter-Buttons (optional)",
    "elements": [ {
      "id": "eindeutige-id, z.B. el-1",
      "type": "heading | text | image | input | textarea | radio | list",
      "content": "Text (bei heading/text)",
      "label": "Feldbezeichnung (bei input/textarea/radio)",
      "placeholder": "Platzhalter (bei input/textarea)",
      "required": true,
      "mapToLeadField": "name | email | phone | company | message (bei Kontaktfeldern)",
      "validation": { "type": "email | phone | text" },
      "options": ["Option A", "Option B"],
      "listItems": [{"id":"li-1","text":"Punkt"}]
    } ]
  } ],
  "theme": { "primaryColor": "#RRGGBB", "backgroundColor": "#RRGGBB", "textColor": "#RRGGBB", "fontFamily": "Inter" }
}

Regeln:
- Erste Seite = "welcome", letzte Seite = "thankyou".
- Mindestens eine "contact"-Seite mit einem E-Mail-Input (required: true, mapToLeadField: "email", validation.type: "email").
- Verwende NUR die oben genannten Element-Typen.
- Überzeugende, konkrete deutsche Copy — keine Platzhalter wie "Lorem ipsum".
- Erzeuge genau die angeforderte Seitenzahl.`;

function buildUserPrompt(input: GenerateFunnelInput): string {
  return [
    `Erstelle einen Funnel mit genau ${input.pageCount} Seiten.`,
    `Angebot/Ziel: ${input.description}`,
    input.audience ? `Zielgruppe: ${input.audience}` : "",
    "Gib ausschließlich das JSON zurück.",
  ].filter(Boolean).join("\n");
}

/** Generiert einen Funnel und validiert ihn strikt gegen das Schema (1 Repair-Retry). */
export async function generateFunnel(cred: DecryptedCredential, input: GenerateFunnelInput): Promise<AiFunnelOutput> {
  const user = buildUserPrompt(input);
  let raw = await chatJson(cred, SYSTEM_PROMPT, user, 4096, GEN_TIMEOUT_MS);

  for (let attempt = 0; attempt < 2; attempt++) {
    let issues = "kein gültiges JSON";
    try {
      const parsed = sanitizeOutput(extractJson(raw));
      const result = aiFunnelOutputSchema.safeParse(parsed);
      if (result.success) return result.data;
      issues = result.error.errors.slice(0, 8).map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    } catch (e) {
      if (e instanceof AiError && e.code !== "AI_INVALID_OUTPUT") throw e; // Provider-Fehler nicht als Output-Fehler behandeln
    }
    if (attempt === 0) {
      raw = await chatJson(
        cred,
        SYSTEM_PROMPT,
        `${user}\n\nDein letzter Output war ungültig (${issues}). Gib ausschließlich korrigiertes JSON im geforderten Format zurück.`,
        4096,
        GEN_TIMEOUT_MS,
      );
    }
  }
  throw new AiError("AI_INVALID_OUTPUT", "Die KI hat keinen gültigen Funnel erzeugt. Bitte die Beschreibung anpassen und erneut versuchen.");
}
