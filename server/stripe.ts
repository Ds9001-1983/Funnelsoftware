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

// Create a Checkout Session for subscription upgrade
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  trialDays?: number
): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error("Stripe ist nicht konfiguriert");

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    ...(trialDays ? { subscription_data: { trial_period_days: trialDays } } : {}),
  });
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
