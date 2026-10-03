import crypto from "crypto";


export interface WebhookPayload {
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
    answers?: unknown;
    source?: string | null;
  };
}

/**
 * Generate a random webhook secret.
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
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
    answers?: unknown;
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
