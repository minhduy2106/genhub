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

echo "Running Prisma schema push..."
npx prisma db push --accept-data-loss 2>&1

echo "Running seed (if needed)..."
# Check if store table has data, if not run seed
HAS_DATA=$(node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
prisma.store.count().then(c => { console.log(c); prisma.\$disconnect(); }).catch(() => { console.log(0); prisma.\$disconnect(); });
" 2>/dev/null)

if [ "$HAS_DATA" = "0" ] || [ -z "$HAS_DATA" ]; then
  echo "  Database is empty, seeding..."
  node dist/prisma/seed.js 2>&1 || echo "  Seed failed, continuing..."
else
  echo "  Database already has data, skipping seed."
fi

echo "Starting GenHub API..."
exec node dist/src/main.js
