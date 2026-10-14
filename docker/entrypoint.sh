#!/bin/sh
# Démarrage du conteneur : migrations Prisma, puis serveur Next.js.
set -eu

echo "[orbit] Migrations de la base de données…"
NODE_PATH=/opt/migrate/node_modules node /opt/migrate/migrate.mjs /app/prisma/migrations

echo "[orbit] Démarrage sur le port ${PORT:-3000}"
exec node server.js
