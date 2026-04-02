#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until node -e "
const net = require('net');
const [host, port] = (process.env.DATABASE_URL || '').match(/@([^:]+):(\d+)/)?.[0]?.replace('@','').split(':') || ['postgres','5432'];
const s = net.createConnection(parseInt(port), host);
s.on('connect', () => { s.destroy(); process.exit(0); });
s.on('error', () => { process.exit(1); });
" 2>/dev/null; do
  echo "  PostgreSQL not ready, retrying in 2s..."
  sleep 2
done
echo "PostgreSQL is ready!"

echo "Running Prisma migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

echo "Running seed (if needed)..."
npx prisma db seed 2>/dev/null || echo "Seed skipped or already seeded"

echo "Starting GenHub API..."
exec node dist/main.js
