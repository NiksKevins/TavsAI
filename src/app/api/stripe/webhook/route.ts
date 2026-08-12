import { getStripe, hasStripeSecret } from "@/lib/stripe";
import { handleStripeEvent } from "@/services/billing/webhook-handlers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasStripeSecret()) {
    return Response.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return Response.json(
      { error: "webhook_secret_missing" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe/webhook] signature", error);
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    return Response.json({ received: true, ...result });
  } catch (error) {
    console.error("[stripe/webhook]", event.type, error);
    return Response.json({ error: "handler_failed" }, { status: 500 });
  }
}
