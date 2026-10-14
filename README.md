# Orbit

Gestionnaire de projets **open source et auto-hébergé** pour petites équipes (1 à 20 personnes), inspiré de [Plane](https://plane.so) et Linear. Sombre, carré, rapide, et installé en une commande sur votre serveur.

## Fonctionnalités

- **Espaces de travail → projets → tâches** : états personnalisables, priorités, labels, assignés, dates, sous-tâches.
- **Quatre vues** : Liste (groupée et repliable), Kanban (glisser-déposer), Calendrier (par échéance), Tableau (cellules éditables, tri).
- **Filtres et regroupements** (état, priorité, assigné, label, cycle, module) et **vues sauvegardées**.
- **Détail d'une tâche** dans un panneau latéral ou en pleine page : description riche (titres, listes, cases à cocher, code, mentions `@`), commentaires, historique complet, pièces jointes (20 Mo max.).
- **Cycles** (sprints) et **modules**, avec progression.
- **Mes tâches**, **Inbox** (assignations, mentions, commentaires), **recherche plein texte** (titres + descriptions, sans tenir compte des accents) et **statistiques** par projet.
- **Clavier** : palette `Ctrl/⌘ K`, `C` pour créer, `/` pour rechercher, `G` puis `P`/`I`/`C`/`M`/`V`/`S` pour naviguer, `?` pour l'aide.
- **Équipe** : invitations par lien, rôles par espace (propriétaire, admin, membre, invité) et par projet (admin, membre, lecteur).

## Installation (production)

Il faut un serveur Linux avec **Docker** (et le plugin `docker compose`), un **nom de domaine** dont le DNS pointe vers ce serveur, et les **ports 80 et 443** ouverts. Le certificat HTTPS est obtenu et renouvelé automatiquement par Caddy (Let's Encrypt).

```bash
# 1. Récupérer Orbit
git clone https://github.com/0jikuji0/Orbit.git /opt/orbit
cd /opt/orbit

# 2. Configurer
cp .env.example .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\"$(openssl rand -hex 24)\"|" .env
sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=\"$(openssl rand -base64 32)\"|" .env
nano .env   # renseigner ORBIT_DOMAIN (ex. orbit.mondomaine.fr) et ACME_EMAIL

# 3. Lancer
docker compose up -d
```

Ouvrez ensuite `https://<votre domaine>`, créez votre compte puis votre espace de travail. Pour inviter l'équipe : **Réglages → Liens d'invitation**.

Au démarrage, le conteneur applique lui-même les migrations de la base. L'état de l'application est disponible sur `https://<votre domaine>/api/health`.

> Pour un essai sur votre machine, mettez `ORBIT_DOMAIN=localhost` : Caddy utilise alors un certificat local (le navigateur affichera un avertissement).

### Mise à jour

```bash
cd /opt/orbit
git pull
docker compose up -d --build
```

### Sauvegardes

`scripts/backup.sh` sauvegarde la base (`pg_dump`) et les pièces jointes dans `./backups`, et supprime les sauvegardes de plus de 7 jours (`KEEP_DAYS` pour changer la durée).

```bash
scripts/backup.sh                   # sauvegarde immédiate
crontab -e                          # puis ajouter, pour une sauvegarde chaque nuit à 3 h :
0 3 * * * cd /opt/orbit && scripts/backup.sh >> backups/backup.log 2>&1
```

Pensez à copier régulièrement `./backups` hors du serveur.

**Restauration** (remplace les données actuelles) :

```bash
docker compose stop app
docker compose exec -T postgres pg_restore -U orbit -d orbit --clean --if-exists --no-owner \
  < backups/orbit-db-AAAA-MM-JJ_HHMMSS.dump
docker compose run --rm --no-deps -T --entrypoint sh app -c "tar -xzf - -C /data/uploads" \
  < backups/orbit-uploads-AAAA-MM-JJ_HHMMSS.tar.gz
docker compose start app
```

### Configuration

| Variable             | Rôle                                                           |
| -------------------- | -------------------------------------------------------------- |
| `ORBIT_DOMAIN`       | Domaine public, sans `https://` (ex. `orbit.mondomaine.fr`).   |
| `ACME_EMAIL`         | E-mail pour Let's Encrypt (avertissements avant expiration).   |
| `POSTGRES_PASSWORD`  | Mot de passe de la base (généré à l'étape 2).                  |
| `BETTER_AUTH_SECRET` | Secret de signature des sessions, 32 caractères min. (généré). |

Les données sont stockées dans des volumes Docker : `orbit_postgres-data` (base), `orbit_uploads` (pièces jointes), `orbit_caddy-data` (certificats).

## Développement

Prérequis : Node.js ≥ 22, pnpm, Docker.

> ⚠️ Sur macOS, ne placez pas le dépôt dans un dossier synchronisé par iCloud Drive
> (`~/Documents`, `~/Desktop`) : iCloud peut décharger des fichiers et bloquer git ou le build.

```bash
pnpm install
cp .env.example .env
pnpm db:up        # PostgreSQL via docker-compose.dev.yml
pnpm db:migrate
pnpm db:seed
pnpm dev          # http://localhost:3000
```

Comptes de démo créés par le seed : `alice@orbit.local` / `bob@orbit.local`, mot de passe `orbit-demo`.

| Commande          | Rôle                                                   |
| ----------------- | ------------------------------------------------------ |
| `pnpm dev`        | serveur de développement                               |
| `pnpm db:up`      | démarre PostgreSQL (Docker)                            |
| `pnpm db:migrate` | crée / applique les migrations Prisma                  |
| `pnpm db:seed`    | (ré)initialise l'espace de démo                        |
| `pnpm lint`       | ESLint, Prettier et règles du design system            |
| `pnpm typecheck`  | TypeScript                                             |
| `pnpm test`       | tests unitaires et d'intégration (Vitest, base de dev) |
| `pnpm test:e2e`   | tests de bout en bout (Playwright)                     |

### Architecture

```
app/                 pages (App Router) et routes API (auth, health, uploads)
components/          ui/ (primitives du design system), issues/, layout/…
lib/                 logique pure et testée (permissions, filtres, recherche…), validateurs zod
server/actions/      server actions (écritures) — server/queries/ (lectures)
prisma/              schéma, migrations, seed
docker/              Dockerfile, Caddyfile, entrypoint
scripts/             backup.sh, migrate.mjs (migrations au démarrage du conteneur)
tests/               unit/ (Vitest), e2e/ (Playwright)
```

Les choix techniques et leurs raisons sont consignés dans [DECISIONS.md](DECISIONS.md).

## Contribuer

Les contributions sont les bienvenues : lisez [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE)
