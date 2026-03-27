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
 * Send webhook payload to a URL. Fire-and-forget with error logging.
 */
export async function sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Trichterwerk-Webhook/1.0",
      },
      body: JSON.stringify(payload),
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
