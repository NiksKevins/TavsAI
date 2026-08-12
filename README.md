# TavsWebs Bot (`bot.tavswebs.com`)

AI Website Employee — multi-tenant SaaS for Latvian businesses.

## Phase 3 (current)

- OpenAI embeddings (`text-embedding-3-small`) + pgvector retrieval
- Prompt architecture with untrusted-data delimiters
- Streaming chat API: `POST /api/ai/chat`
- Conversation memory + usage cost tracking
- Crawl pipeline now embeds chunks after extraction

### Manual AI test

1. Set `OPENAI_API_KEY` in `.env` / `.env.local`
2. Crawl a website (Knowledge → Scan) so chunks get embeddings
3. While logged in:

```bash
curl -N -X POST http://127.0.0.1:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: $(echo 'paste auth cookie from browser')" \
  -d '{"message":"Cik maksā mājaslapas izstrāde?","locale":"lv","stream":true}'
```

Or non-streaming:

```bash
curl -X POST http://127.0.0.1:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: ..." \
  -d '{"message":"Kur jūs atrodaties?","locale":"lv","stream":false}'
```

Widget-style (after you copy publicKey from DB / future widget UI):

```bash
curl -X POST http://127.0.0.1:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"<widget-public-key>","message":"Vai strādājat sestdien?","locale":"lv","stream":false}'
```

## Phase 8 — Stripe billing

See [docs/stripe-billing.md](docs/stripe-billing.md) for Checkout, webhooks (`https://bot.tavswebs.com/api/stripe/webhook`), and plan limits.

Dashboard: `/dashboard/billing`

## Phase 10 — Appointments

See [docs/appointments.md](docs/appointments.md). Connect Google Calendar under `/dashboard/integrations`. Bookings only confirm after the calendar accepts the event.

## Local setup

```bash
cp .env.example .env.local
npm install
npx prisma migrate deploy
npm run dev -- --hostname 127.0.0.1 --port 3001
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

## Next phase

**Phase 4 — Widget:** embeddable chat UI consuming `/api/ai/chat` stream.
