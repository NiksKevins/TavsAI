# Stripe billing (bot.tavswebs.com)

Production billing uses **Stripe Checkout**, **Subscriptions**, and the **Customer Portal**. Secrets stay on the server — never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` to the browser.

## Plans

| Plan | Price | Conversations / month |
|------|-------|------------------------|
| FREE | €0 | 100 |
| STARTER | €19 | 500 |
| BUSINESS | €39 | 2,000 |
| PRO | €79 | 10,000 |

## Environment variables

```bash
STRIPE_SECRET_KEY=sk_test_...          # or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # optional (Checkout is hosted)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_BUSINESS=price_...
STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_APP_URL=https://bot.tavswebs.com
```

Create three **recurring monthly EUR** Prices in the Stripe Dashboard (Products) and paste their `price_…` IDs into the env vars above.

**Do not** paste Product IDs (`prod_…`) — Checkout only accepts Price IDs (`price_…`). In the Dashboard: Product → Pricing → copy the price starting with `price_`.

## Webhook endpoint (production)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL:

   `https://bot.tavswebs.com/api/stripe/webhook`

3. Events to send:

   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.paid`

4. Copy the endpoint signing secret → `STRIPE_WEBHOOK_SECRET`

Handlers verify the Stripe signature and are **idempotent** via `ProcessedStripeEvent` (Stripe `event.id`).

## Local test mode

```bash
# Terminal A — app
npm run dev -- --hostname 127.0.0.1 --port 3001

# Terminal B — forward webhooks
stripe listen --forward-to 127.0.0.1:3001/api/stripe/webhook
```

Use the webhook signing secret printed by `stripe listen` as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

Card for successful test payments: `4242 4242 4242 4242`.

## Flows

| Action | Mechanism |
|--------|-----------|
| Free → paid | Stripe Checkout (`mode=subscription`) |
| Upgrade / downgrade | Server updates subscription item + proration |
| Payment method / invoices | Stripe Customer Portal |
| Cancel | `cancel_at_period_end` (or Portal) |
| Payment failure | `invoice.payment_failed` → `PAST_DUE` + in-app notification |

## Usage enforcement

Before OpenAI is called, the chat API checks workspace → subscription plan → monthly conversation usage. New conversations over the plan limit return an upgrade message (`402` when not streaming) and **do not** call OpenAI.

## Dashboard

`/dashboard/billing` — current plan, usage, cycle, payment method, invoices, upgrade/cancel.
