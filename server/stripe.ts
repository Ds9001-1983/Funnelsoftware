import Stripe from "stripe";

// Initialize Stripe - only if key is configured
const stripeKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeKey
  ? new Stripe(stripeKey)
  : null;

export function isStripeConfigured(): boolean {
  return stripe !== null;
}

// Create or retrieve a Stripe customer for a user
export async function getOrCreateStripeCustomer(user: {
  id: number;
  email: string;
  displayName: string | null;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (!stripe) throw new Error("Stripe ist nicht konfiguriert");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.displayName || undefined,
    metadata: { userId: String(user.id) },
  });

  return customer.id;
}

export interface CheckoutOptions {
  /** Fester Trial in Tagen (Registrierungs-Flow). */
  trialDays?: number;
  /**
   * Bestehendes Trial-Ende übernehmen (Upgrade aus laufendem Trial) —
   * der Kunde behält seine versprochenen Gratis-Tage. Stripe verlangt
   * mindestens 48h in der Zukunft, sonst wird ohne Trial abgerechnet.
   */
  trialEnd?: Date | null;
  /** Unsere User-ID — Fallback fürs Webhook-Matching, falls die Customer-ID nicht (rechtzeitig) persistiert wurde. */
  clientReferenceId?: string;
}

const MIN_TRIAL_END_MS = 48 * 60 * 60 * 1000;

// Create a Checkout Session for subscription upgrade
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  options: CheckoutOptions = {}
): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error("Stripe ist nicht konfiguriert");

  let subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData | undefined;
  if (options.trialEnd && options.trialEnd.getTime() > Date.now() + MIN_TRIAL_END_MS) {
    subscriptionData = { trial_end: Math.floor(options.trialEnd.getTime() / 1000) };
  } else if (options.trialDays) {
    subscriptionData = { trial_period_days: options.trialDays };
  }

  // Stripe Tax (USt) — erst aktivieren, wenn Stripe Tax im Dashboard
  // konfiguriert ist, sonst schlägt die Session-Erstellung fehl.
  const taxEnabled = process.env.STRIPE_TAX_ENABLED === "true";

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    ...(options.clientReferenceId ? { client_reference_id: options.clientReferenceId } : {}),
    ...(subscriptionData ? { subscription_data: subscriptionData } : {}),
    ...(taxEnabled
      ? {
          automatic_tax: { enabled: true },
          billing_address_collection: "required" as const,
          customer_update: { address: "auto" as const, name: "auto" as const },
          tax_id_collection: { enabled: true },
        }
      : {}),
  });
}

/**
 * Findet eine Subscription des Customers, die einem neuen Checkout im Weg
 * steht (aktiv, im Trial, in Zahlungsverzug oder in Anbahnung). Verhindert
 * Doppel-Abos, wenn z.B. die Registrierungs-Session UND eine spätere
 * Settings-Session abgeschlossen werden.
 */
export async function findBlockingSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) throw new Error("Stripe ist nicht konfiguriert");

  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  return (
    subs.data.find((s) =>
      ["active", "trialing", "past_due", "incomplete", "unpaid"].includes(s.status)
    ) ?? null
  );
}

/**
 * Kündigt alle nicht beendeten Subscriptions eines Customers sofort.
 * Wird vor einer Account-Löschung aufgerufen — sonst bucht Stripe nach dem
 * Löschen der DB-Zeile dauerhaft weiter ab, ohne dass Webhooks noch einen
 * Benutzer finden.
 */
export async function cancelAllSubscriptions(customerId: string): Promise<void> {
  if (!stripe) throw new Error("Stripe ist nicht konfiguriert");

  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  for (const sub of subs.data) {
    if (sub.status !== "canceled" && sub.status !== "incomplete_expired") {
      await stripe.subscriptions.cancel(sub.id);
    }
  }
}

// Create a Customer Portal session for subscription management
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) throw new Error("Stripe ist nicht konfiguriert");

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Verify and construct a webhook event from raw body
export function constructWebhookEvent(
  rawBody: Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) throw new Error("Stripe ist nicht konfiguriert");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET nicht gesetzt");

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
