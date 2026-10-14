# syntax=docker/dockerfile:1.7
# Image de production d'Orbit — `docker compose up -d` à la racine du dépôt.

ARG NODE_VERSION=22-alpine

# ─── 1. Dépendances ───────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Le schéma est nécessaire au `prisma generate` lancé après l'installation.
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─── 2. Build Next.js (sortie « standalone ») ─────────────────────────────
FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Valeurs factices : aucune connexion n'est ouverte pendant le build.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    BETTER_AUTH_SECRET="build-time-placeholder-secret-0000000" \
    pnpm build

# ─── 3. CLI Prisma seule, pour appliquer les migrations au démarrage ──────
FROM node:${NODE_VERSION} AS migrator
# Doit correspondre à la version de `prisma` dans package.json.
ARG PRISMA_VERSION=6.19.3
WORKDIR /opt/prisma
RUN npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund "prisma@${PRISMA_VERSION}" \
 && npm cache clean --force

# ─── 4. Image finale ──────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads

# npm, yarn et corepack ne servent pas à l'exécution : on allège l'image.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn* /usr/local/bin/yarn* \
 && mkdir -p /data/uploads && chown -R node:node /data

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=migrator --chown=node:node /opt/prisma /opt/prisma
COPY --chown=node:node docker/entrypoint.sh /usr/local/bin/orbit-entrypoint

USER node
VOLUME ["/data/uploads"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/orbit-entrypoint"]
