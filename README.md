# Orbit

Gestionnaire de projets **open source et auto-hébergé** pour petites équipes (1–20 personnes), inspiré de [Plane](https://plane.so) et Linear.

- Espaces de travail → projets → tâches (états, priorités, labels, assignés)
- Vues Liste, Kanban, Calendrier, Tableau
- Cycles (sprints) et modules
- Déploiement en une commande : `docker compose up -d`

> 🚧 Projet en cours de développement — voir la [feuille de route](#feuille-de-route).

## Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · PostgreSQL 16 · Prisma · better-auth · TanStack Query · Tiptap · dnd-kit

## Développement

Prérequis : Node.js ≥ 22, pnpm, Docker.

> ⚠️ Sur macOS, ne placez pas le dépôt dans un dossier synchronisé par iCloud Drive
> (`~/Documents`, `~/Desktop`) : iCloud peut décharger des fichiers et bloquer git ou le build.

```bash
pnpm install
cp .env.example .env
pnpm db:up   # Postgres via docker-compose.dev.yml
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Comptes de démo créés par le seed : `alice@orbit.local` / `bob@orbit.local`, mot de passe `orbit-demo`.

| Commande          | Rôle                               |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | serveur de développement           |
| `pnpm db:up`      | démarre Postgres (Docker)          |
| `pnpm db:migrate` | migrations Prisma                  |
| `pnpm db:seed`    | données de démo                    |
| `pnpm lint`       | ESLint + Prettier                  |
| `pnpm test`       | tests unitaires (Vitest)           |
| `pnpm test:e2e`   | tests de bout en bout (Playwright) |

## Feuille de route

- [x] Phase 0 — Fondations (design system, layout)
- [x] Phase 1 — Comptes & structure
- [x] Phase 2 — Tâches (liste, kanban)
- [x] Phase 3 — Détail d'une tâche
- [ ] Phase 4 — Organisation (cycles, modules, vues)
- [ ] Phase 5 — Suivi (inbox, recherche, analytics)
- [ ] Phase 6 — Production (Docker, Caddy, sauvegardes)

## Contribuer

Les contributions sont les bienvenues : lisez [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE)
