#!/bin/sh
set -e

echo "==> Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma
if [ $? -ne 0 ]; then
  echo "!!! Migration failed. Aborting startup."
  exit 1
fi
echo "==> Migrations complete."

echo "==> Starting Nitro server..."
exec node .output/server/index.mjs
