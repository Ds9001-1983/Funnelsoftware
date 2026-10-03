export type WebhookStatus = "pending" | "processing" | "delivered" | "failed" | "cancelled";
export interface WebhookAttempt { attempt: number; outcome: string; statusCode: number | null; errorCode: string | null; startedAt: string; finishedAt: string | null }
export interface WebhookDelivery { id: number; eventId: string; leadId: number; status: WebhookStatus; attempts: number; nextAttemptAt: string; createdAt: string; deliveredAt: string | null; errorCode: string | null; history: WebhookAttempt[] }
export interface WebhookDeliveryList { items: WebhookDelivery[]; nextCursor: number | null }
