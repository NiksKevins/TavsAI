# Appointment booking (Phase 10)

The AI **never invents available times**. Slots come only from a connected `CalendarIntegration` (Google Calendar first).

## Env

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TOKEN_ENCRYPTION_KEY=   # openssl rand -hex 32
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3001
```

Google Cloud Console → OAuth client (Web) → Authorized redirect URI:

`http://127.0.0.1:3001/api/integrations/google/callback`

(Production: `https://bot.tavswebs.com/api/integrations/google/callback`)

## Connect

Dashboard → **Integrations** → Connect Google Calendar.

Tokens are AES-256-GCM encrypted (`TOKEN_ENCRYPTION_KEY`) in `Integration.accessTokenEnc` / `refreshTokenEnc` — never returned to the browser.

## Chat flow

1. Customer asks to book  
2. AI booking flow asks service → preferred day  
3. FreeBusy ∩ working hours → real slots only  
4. Customer picks a slot + name/phone or email  
5. Create `PENDING` appointment → Google event → `CONFIRMED`  
6. Only then: “Jūsu vizīte ir apstiprināta.”

On provider failure → `FAILED` + contact-capture message (never claim success).

## Dashboard

`/dashboard/appointments` — Today / Upcoming / Past / Cancelled
