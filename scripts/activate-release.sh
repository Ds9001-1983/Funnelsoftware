#!/usr/bin/env bash
# Called only after build, backup/restore, migration and preliminary inventory.
# Explicit paths also allow failure scenarios to run against temporary fixtures.
set -euo pipefail
APP_DIR="${1:?App-Verzeichnis fehlt}"
RELEASE_DIR="${2:?Release-Verzeichnis fehlt}"
BACKUP_DIR="${3:?Sicherungsverzeichnis fehlt}"
PREVIOUS_SHA="${4:?Vorheriger Commit fehlt}"
DEPLOY_SHA="${5:?Neuer Commit fehlt}"
NGINX_SITE="${6:?nginx-Konfiguration fehlt}"
cd "$RELEASE_DIR"
test -L "$APP_DIR/dist"
test -d "$RELEASE_DIR/dist"
test -d "$BACKUP_DIR"
test -f "$NGINX_SITE"
PREVIOUS_DIST="$(readlink "$APP_DIR/dist")"
printf '%s\n' "$PREVIOUS_DIST" > "$BACKUP_DIR/previous-dist"
cp -p "$NGINX_SITE" "$BACKUP_DIR/nginx-site"
NEXT_NGINX="$(mktemp "${NGINX_SITE}.next.XXXXXXXX")"
NEXT_DIST="$APP_DIR/.dist-next-$$"
ACTIVATING=0
COMMITTED=0

replace_file() {
  node -e 'require("node:fs").renameSync(process.argv[1], process.argv[2])' "$1" "$2"
}
point_dist() {
  ln -s "$1" "$NEXT_DIST"
  replace_file "$NEXT_DIST" "$APP_DIR/dist"
}
healthy() {
  local wanted="$1"
  for attempt in $(seq 1 30); do
    if curl --max-time 2 -sf http://127.0.0.1:5000/api/health | node -e '
      let body=""; process.stdin.on("data", part => body+=part); process.stdin.on("end", () => {
        try { const result=JSON.parse(body); process.exit(result.status === "ok" && result.release === process.argv[1] ? 0 : 1); } catch { process.exit(1); }
      });' "$wanted"; then return 0; fi
    sleep 2
  done
  return 1
}
cleanup() {
  local result=$?
  trap - EXIT INT TERM
  if [ "$ACTIVATING" = 1 ] && [ "$COMMITTED" = 0 ]; then
    echo "Umschaltung fehlgeschlagen; bisheriges Release und nginx-Konfiguration wiederherstellen."
    # Keep trying the remaining recovery steps if one of them fails.
    set +e
    pm2 stop funnelflow
    rm -f "$NEXT_DIST"
    point_dist "$PREVIOUS_DIST"
    cp -p "$BACKUP_DIR/nginx-site" "$NEXT_NGINX"
    replace_file "$NEXT_NGINX" "$NGINX_SITE"
    nginx -t && systemctl reload nginx
    export APP_RELEASE_SHA="$PREVIOUS_SHA"
    pm2 restart funnelflow --update-env
    if ! healthy "$PREVIOUS_SHA"; then echo "ACHTUNG: Wiederanlauf muss manuell geprüft werden." >&2; fi
    pm2 save
    result=1
  fi
  rm -f "$NEXT_DIST" "$NEXT_NGINX"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Prepare the narrow nginx patch while the previous application is still online.
cp -p "$NGINX_SITE" "$NEXT_NGINX"
node scripts/configure-upload-cache.mjs "$NGINX_SITE" "$NEXT_NGINX"
ACTIVATING=1
# No old writer may add an unowned file after the final inventory. PM2 waits
# for process exit; interrupted/partial legacy files are caught by the audit.
pm2 stop funnelflow
node scripts/audit-upload-ownership.mjs
NODE_ENV=production node --import tsx scripts/erasure-journal.ts prepare-release "$BACKUP_DIR" "$APP_DIR"
replace_file "$NEXT_NGINX" "$NGINX_SITE"
nginx -t
systemctl reload nginx
point_dist "$RELEASE_DIR/dist"
export APP_RELEASE_SHA="$DEPLOY_SHA"
pm2 restart funnelflow --update-env
healthy "$DEPLOY_SHA"
pm2 save
COMMITTED=1
