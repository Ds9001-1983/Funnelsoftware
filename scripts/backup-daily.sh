#!/usr/bin/env bash
# Daily server backup; uses the same lock as deployment, transfer and retention.
set -euo pipefail
umask 077
RUNTIME=/var/lib/funnelflow/backup-retention
APP=/var/www/funnelflow
ROOT=/var/backups/funnelflow
test -f "$RUNTIME/config.json"
exec 9>"$RUNTIME/operation.lock"
flock -w 1800 9
cd "$APP"
DB_NAME="$(node --input-type=module <<'NODE'
import 'dotenv/config';
const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.search || !/^\/[a-zA-Z0-9_]+$/.test(url.pathname)) process.exit(1);
console.log(url.pathname.slice(1));
NODE
)"
STAMP="$(date -u +%Y-%m-%d_%H-%M)"
STAGING="$(mktemp -d "$ROOT/.daily-stage-XXXXXXXX")"
RESTORE_DB="tw_restore_daily_$(date -u +%Y%m%d%H%M%S)_${RANDOM}"
cleanup() {
  runuser -u postgres -- dropdb --if-exists "$RESTORE_DB" >/dev/null
  rm -f "$STAGING/db.gz" "$STAGING/uploads.tar.gz"
  rmdir "$STAGING"
}
trap cleanup EXIT
test ! -e "$ROOT/db_$STAMP.gz"
test ! -e "$ROOT/uploads_$STAMP.tar.gz"
runuser -u postgres -- pg_dump --no-owner --no-acl "$DB_NAME" | gzip > "$STAGING/db.gz"
tar -czf "$STAGING/uploads.tar.gz" -C "$APP" uploads private-uploads
gzip -t "$STAGING/db.gz"
tar -tzf "$STAGING/uploads.tar.gz" >/dev/null
runuser -u postgres -- createdb "$RESTORE_DB"
gzip -dc "$STAGING/db.gz" | runuser -u postgres -- psql -X --set ON_ERROR_STOP=on -d "$RESTORE_DB" >/dev/null
# The reference checkout may contain root-only files after deployment. The
# active build worktree is the readable code that already serves production.
VERIFY_DIR="$(dirname "$(readlink -f "$APP/dist")")"
[[ "$VERIFY_DIR" == /var/www/funnelflow-release-* ]]
runuser -u postgres -- env DATABASE_URL="postgresql://postgres@localhost/$RESTORE_DB?host=/var/run/postgresql" node "$VERIFY_DIR/scripts/verify-migration.mjs"
mv "$STAGING/db.gz" "$ROOT/db_$STAMP.gz"
mv "$STAGING/uploads.tar.gz" "$ROOT/uploads_$STAMP.tar.gz"
python3 "$RUNTIME/backup-operations.py" record-daily "$RUNTIME/config.json" "$STAMP"
printf 'Daily backup and isolated restore verified: %s\n' "$STAMP"
