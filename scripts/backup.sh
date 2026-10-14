#!/usr/bin/env bash
# Sauvegarde d'Orbit : base PostgreSQL (pg_dump) + pièces jointes, avec rotation.
#
# Usage   : scripts/backup.sh [dossier]          (défaut : ./backups)
# Cron    : 0 3 * * * cd /opt/orbit && scripts/backup.sh >> backups/backup.log 2>&1
# Options : KEEP_DAYS=7 (rétention), ORBIT_ENV_FILE=.env (fichier d'environnement de compose)
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${1:-${BACKUP_DIR:-./backups}}"
KEEP_DAYS="${KEEP_DAYS:-7}"
COMPOSE=(docker compose --env-file "${ORBIT_ENV_FILE:-.env}")
STAMP="$(date +%Y-%m-%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"
DB_FILE="$BACKUP_DIR/orbit-db-$STAMP.dump"
FILES_FILE="$BACKUP_DIR/orbit-uploads-$STAMP.tar.gz"

# Fichiers écrits sous un nom temporaire puis renommés : jamais de sauvegarde à moitié écrite.
cleanup() { rm -f "$DB_FILE.part" "$FILES_FILE.part"; }
trap cleanup EXIT

echo "[backup] $(date '+%F %T') — base de données…"
"${COMPOSE[@]}" exec -T postgres pg_dump -U orbit -d orbit --format=custom --no-owner >"$DB_FILE.part"
mv "$DB_FILE.part" "$DB_FILE"

echo "[backup] $(date '+%F %T') — pièces jointes…"
"${COMPOSE[@]}" exec -T app tar -czf - -C /data/uploads . >"$FILES_FILE.part"
mv "$FILES_FILE.part" "$FILES_FILE"

# Rotation : suppression des sauvegardes de plus de KEEP_DAYS jours.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'orbit-*' -mmin +$((KEEP_DAYS * 24 * 60)) -print -delete |
  sed 's/^/[backup] supprimée : /'

echo "[backup] OK : $(du -h "$DB_FILE" | cut -f1) (base), $(du -h "$FILES_FILE" | cut -f1) (fichiers) → $BACKUP_DIR"
