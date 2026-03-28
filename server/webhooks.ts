import crypto from "crypto";


interface WebhookPayload {
  event: "lead_created";
  funnel_id: string;
  funnel_name: string;
  lead_id: string;
  timestamp: string;
  data: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    message?: string | null;
    answers?: Record<string, any> | null;
    source?: string | null;
  };
}

/**
 * Generate HMAC-SHA256 signature for a payload.
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Generate a random webhook secret.
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send webhook payload to a URL with optional HMAC signature.
 * Fire-and-forget with error logging.
 */
export async function sendWebhook(url: string, payload: WebhookPayload, secret?: string | null): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const body = JSON.stringify(payload);
    const timestamp = new Date().toISOString();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Trichterwerk-Webhook/1.0",
      "X-Trichterwerk-Timestamp": timestamp,
    };

    // Add HMAC signature if secret is available
    if (secret) {
      const signature = signPayload(body, secret);
      headers["X-Trichterwerk-Signature"] = `sha256=${signature}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`Webhook delivery failed: ${url} → ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`Webhook delivery error: ${url} →`, error instanceof Error ? error.message : error);
  }
}

/**
 * Build webhook payload from lead and funnel data.
 */
export function buildWebhookPayload(
  funnel: { uuid: string; name: string },
  lead: {
    uuid: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    message?: string | null;
    answers?: Record<string, any> | null;
    source?: string | null;
  }
): WebhookPayload {
  return {
    event: "lead_created",
    funnel_id: funnel.uuid,
    funnel_name: funnel.name,
    lead_id: lead.uuid,
    timestamp: new Date().toISOString(),
    data: {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      message: lead.message,
      answers: lead.answers,
      source: lead.source,
    },
  };
}
