# Partner / Agency system (TavsWebs)

bot.tavswebs.com supports a **partner (agency) layer** so TavsWebs can sell:

**Website + AI Website Employee**

as a combined service, while the normal SaaS product keeps working for direct customers.

## Architecture principle

Partner data lives in **join tables** only:

| Model | Role |
|-------|------|
| `Partner` | Agency account (e.g. TavsWebs) |
| `PartnerMember` | Users who can open `/partner` |
| `PartnerWorkspace` | Links a customer `Workspace` → partner |
| `Referral` | Partner tracking codes (`?ref=CODE`) |
| `Commission` | Recurring earnings from Stripe invoices |

`Workspace` does **not** require a partner. Direct SaaS signups are unchanged.

## Commercial flow

1. TavsWebs builds the customer website (outside this app).
2. Customer registers on bot.tavswebs.com with `?ref=TAVSWEBS` (or is linked manually).
3. Customer activates the AI assistant (onboarding complete → `PartnerWorkspace.activatedAt`).
4. Customer pays monthly via Stripe.
5. On `invoice.paid`, a `Commission` row is created (default **20%** recurring, configurable in bps).

## Commission

- Stored as **basis points** on `Partner.defaultCommissionBps` (default `2000` = 20%).
- Optional per-customer override: `PartnerWorkspace.commissionBpsOverride`.
- Idempotent on `Commission.stripeInvoiceId`.

## Partner portal

- `/partner` — stats, commission rate, referral codes, recent commissions
- `/partner/customers` — linked workspaces

First visit without membership: **Bootstrap TavsWebs partner** (creates partner + OWNER membership + default referral `TAVSWEBS`).

## White-label (prepared, not implemented)

Reserved on `Partner` for later:

- `branding` (JSON: logo, color, display name)
- `customDomain`
- `widgetBrandName`

Do not apply these in the product UI until a dedicated white-label phase.

## Referral registration

```
https://bot.tavswebs.com/register?ref=TAVSWEBS
```

## Code map

- `src/services/partner/*` — partner + commission logic
- `src/lib/partner/authz.ts` — partner portal auth (separate from workspace authz)
- `src/app/(partner)/partner/*` — portal UI
- Billing hook: `onInvoicePaid` → `recordPartnerCommissionFromInvoice`
