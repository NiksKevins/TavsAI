import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function hasStripeSecret(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Server-only Stripe client. Never import this into client components. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }
  return stripeClient;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3001"
  );
}
