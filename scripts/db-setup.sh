#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! docker ps --format '{{.Names}}' | grep -qx 'bot-tavswebs-pg'; then
  if docker ps -a --format '{{.Names}}' | grep -qx 'bot-tavswebs-pg'; then
    docker start bot-tavswebs-pg
  else
    docker run -d --name bot-tavswebs-pg \
      -e POSTGRES_USER=bot \
      -e POSTGRES_PASSWORD=bot \
      -e POSTGRES_DB=bot_tavswebs \
      -p 5433:5432 \
      pgvector/pgvector:pg16
  fi
fi

echo "Waiting for Postgres..."
for _ in $(seq 1 40); do
  if docker exec bot-tavswebs-pg pg_isready -U bot -d bot_tavswebs >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec bot-tavswebs-pg psql -U bot -d bot_tavswebs -c 'CREATE EXTENSION IF NOT EXISTS vector;'
npx prisma migrate deploy
echo "Database ready."
