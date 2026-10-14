#!/bin/sh
# Démarrage du conteneur : migrations Prisma, puis serveur Next.js.
set -eu

echo "[orbit] Application des migrations…"
node /opt/prisma/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma

echo "[orbit] Démarrage sur le port ${PORT:-3000}"
exec node server.js
