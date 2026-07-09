#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until node -e "
const net = require(\"net\");
let host = \"postgres\";
let port = \"5432\";
try {
  const url = new URL(process.env.DATABASE_URL || \"postgresql://genhub:genhub_secret@postgres:5432/genhub\");
  host = url.hostname || host;
  port = url.port || port;
} catch {}
const s = net.createConnection(Number(port), host);
s.on(\"connect\", () => { s.destroy(); process.exit(0); });
s.on(\"error\", () => { process.exit(1); });
" 2>/dev/null; do
  echo "  PostgreSQL not ready, retrying in 2s..."
  sleep 2
done
echo "PostgreSQL is ready!"

echo "Running database migrations..."
npx prisma migrate deploy 2>&1
echo "Database migrations complete."

if [ "${ENABLE_DEMO_SEED:-false}" = "true" ]; then
  echo "ENABLE_DEMO_SEED=true, running demo seed..."
  node dist/prisma/seed.js 2>&1
else
  echo "Skipping demo seed. Use ENABLE_DEMO_SEED=true only for disposable demos."
fi

echo "Starting GenHub API..."
exec node dist/src/main.js
