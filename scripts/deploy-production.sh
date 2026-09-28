#!/usr/bin/env bash
# Auf dem bestehenden Hetzner-Server als root; nur einen bereits geprüften SHA.
# Baut separat, prüft ein frisches Backup und migriert ausschließlich additiv.
set -euo pipefail
umask 022
DEPLOY_SHA="${1:?Geprüfter Commit fehlt}"
[[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]] || exit 64
APP_DIR=/var/www/funnelflow
cd "$APP_DIR"
git diff --quiet
git diff --cached --quiet
PREVIOUS_SHA="$(git rev-parse HEAD)"
git fetch origin main
git merge-base --is-ancestor "$DEPLOY_SHA" origin/main
RELEASE_DIR="$(mktemp -d /var/www/funnelflow-release-XXXXXXXX)"
chmod 755 "$RELEASE_DIR"
git worktree add --detach "$RELEASE_DIR" "$DEPLOY_SHA"
ln -s "$APP_DIR/.env" "$RELEASE_DIR/.env"
cd "$RELEASE_DIR"
npm ci --no-audit --no-fund
npm run build
test -s dist/index.cjs
test -s dist/public/index.html

# Laufzeitdateien bleiben am bisherigen Ort und werden gemeinsam gesichert.
rm uploads/.gitkeep
rmdir uploads
ln -s "$APP_DIR/uploads" uploads
mkdir -p "$APP_DIR/private-uploads"
ln -s "$APP_DIR/private-uploads" private-uploads

DB_NAME="$(node --input-type=module <<'NODE'
import 'dotenv/config';
const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.search || !/^\/[a-zA-Z0-9_]+$/.test(url.pathname)) process.exit(1);
console.log(url.pathname.slice(1));
NODE
)"
umask 077
BACKUP_DIR="/var/backups/funnelflow/releases/$(date -u +%Y%m%dT%H%M%S)-${DEPLOY_SHA:0:12}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
runuser -u postgres -- pg_dump --format=custom "$DB_NAME" > "$BACKUP_DIR/db.dump"
tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$APP_DIR" uploads private-uploads
tar -tzf "$BACKUP_DIR/uploads.tar.gz" >/dev/null
cp -p "$APP_DIR/.env" "$BACKUP_DIR/environment"

RESTORE_DB="tw_restore_$(date -u +%Y%m%d%H%M%S)_${RANDOM}"
cleanup_restore() { runuser -u postgres -- dropdb --if-exists "$RESTORE_DB" >/dev/null; }
trap cleanup_restore EXIT
runuser -u postgres -- createdb "$RESTORE_DB"
runuser -u postgres -- pg_restore --no-owner --no-acl --exit-on-error -d "$RESTORE_DB" < "$BACKUP_DIR/db.dump"
runuser -u postgres -- env DATABASE_URL="postgresql://postgres@localhost/$RESTORE_DB?host=/var/run/postgresql" node scripts/verify-migration.mjs
cleanup_restore
trap - EXIT
printf '%s\n' "$DEPLOY_SHA" > "$BACKUP_DIR/commit"
sha256sum "$BACKUP_DIR/db.dump" "$BACKUP_DIR/uploads.tar.gz" > "$BACKUP_DIR/SHA256SUMS"

# PM2 behält bei startOrReload den bisherigen Skriptpfad. Deshalb bleibt
# sein Einstieg stabil; ein atomarer dist-Symlink schaltet Backend UND die
# nginx-Assets gemeinsam auf den vollständig gebauten Release um.
pm2 jlist | node --input-type=module -e '
import fs from "node:fs";
const app=JSON.parse(fs.readFileSync(0,"utf8")).find(app=>app.name==="funnelflow");
if (!app || app.pm2_env.pm_exec_path!=="/var/www/funnelflow/dist/index.cjs" || app.pm2_env.pm_cwd!=="/var/www/funnelflow") process.exit(1);'
# Bereits geöffnete Browser dürfen ihre alten Hash-Assets weiter nachladen.
cp -an "$APP_DIR/dist/public/assets/." "$RELEASE_DIR/dist/public/assets/"
node scripts/migrate.mjs
PREVIOUS_DIST="$(readlink -f "$APP_DIR/dist")"
if [ ! -L "$APP_DIR/dist" ]; then
  PREVIOUS_DIST="/var/www/funnelflow-dist-$(date -u +%Y%m%dT%H%M%S)"
  mv "$APP_DIR/dist" "$PREVIOUS_DIST"
fi
printf '%s\n' "$PREVIOUS_DIST" > "$BACKUP_DIR/previous-dist"
point_dist() {
  ln -s "$1" "$APP_DIR/dist.next"
  mv -Tf "$APP_DIR/dist.next" "$APP_DIR/dist"
}
point_dist "$RELEASE_DIR/dist"
set -a
. "$APP_DIR/.env"
set +a
export APP_RELEASE_SHA="$DEPLOY_SHA"
healthy() {
  for attempt in $(seq 1 30); do
    if curl --max-time 2 -sf http://127.0.0.1:5000/api/health | node -e '
      let body=""; process.stdin.on("data", part => body+=part); process.stdin.on("end", () => {
        try { const result=JSON.parse(body); process.exit(result.status === "ok" && (!process.argv[1] || result.release === process.argv[1]) ? 0 : 1); } catch { process.exit(1); }
      });' "${1:-}"; then return 0; fi
    sleep 2
  done
  return 1
}
if ! pm2 restart funnelflow --update-env || ! healthy "$DEPLOY_SHA"; then
  echo "Release fehlgeschlagen; stelle vorherigen Code wieder her. Additives Schema und neue Leads bleiben erhalten."
  point_dist "$PREVIOUS_DIST"
  export APP_RELEASE_SHA="$PREVIOUS_SHA"
  pm2 restart funnelflow --update-env
  healthy
  pm2 save
  exit 1
fi
pm2 save
# Referenz-Checkout nach erfolgreichem Start nachführen; unversionierte Backups
# und Konfigurationen bleiben erhalten. Der laufende Release ist unabhängig.
git -C "$APP_DIR" reset --hard "$DEPLOY_SHA"
printf 'Release erfolgreich: %s\nBackup mit Restore-Test: %s\n' "$DEPLOY_SHA" "$BACKUP_DIR"
