#!/usr/bin/env bash
#
# Setzt ein Secret in der Production-.env und startet PM2 so neu, dass der
# Prozess die neue Variable auch wirklich sieht.
#
#   ./scripts/set-prod-secret.sh META_CAPI_TOKEN
#   ./scripts/set-prod-secret.sh META_CAPI_TOKEN --check   # nur prüfen
#
# Der Wert wird interaktiv und verdeckt abgefragt — er landet dadurch weder in
# der Shell-History noch in der Prozessliste (weder lokal noch auf dem Server).
# Ausgegeben wird er nie, nur maskiert.
#
# Hintergrund PM2: `pm2 restart` allein übernimmt KEINE neuen ENV-Variablen —
# der Prozess behält die Umgebung vom letzten Start. Nur `--update-env` mit
# vorher exportierter .env zieht sie nach. Genau daran scheitert sonst jedes
# neu gesetzte Secret lautlos (die App läuft, die Variable ist aber leer).
#
set -euo pipefail

SSH_HOST="${SSH_HOST:-root@trichterwerk.de}"
APP_DIR="/var/www/funnelflow"
PM2_NAME="funnelflow"

KEY="${1:-}"
MODE="${2:-set}"

if [[ -z "$KEY" ]]; then
  echo "Aufruf: $0 <ENV_KEY> [--check]" >&2
  exit 64
fi

if [[ ! "$KEY" =~ ^[A-Z][A-Z0-9_]*$ ]]; then
  echo "Fehler: '$KEY' ist kein gültiger ENV-Name (erwartet: GROSSBUCHSTABEN_MIT_UNTERSTRICH)." >&2
  exit 64
fi

# --- Nur prüfen -------------------------------------------------------------
if [[ "$MODE" == "--check" ]]; then
  ssh "$SSH_HOST" "bash -s" <<REMOTE_CHECK
set -euo pipefail
cd "$APP_DIR"
if grep -q "^${KEY}=" .env 2>/dev/null; then
  len=\$(grep "^${KEY}=" .env | head -1 | cut -d= -f2- | tr -d '"'"'"'"' | wc -c)
  echo ".env      : ${KEY} gesetzt (\$((len - 1)) Zeichen)"
else
  echo ".env      : ${KEY} FEHLT"
fi
if pm2 env 0 2>/dev/null | grep -q "^${KEY}:"; then
  echo "PM2-Prozess: ${KEY} sichtbar"
else
  echo "PM2-Prozess: ${KEY} NICHT sichtbar — Neustart mit --update-env nötig"
fi
REMOTE_CHECK
  exit 0
fi

# --- Wert abfragen ----------------------------------------------------------
printf 'Wert für %s (Eingabe bleibt unsichtbar): ' "$KEY" >&2
read -rs VALUE
printf '\n' >&2

if [[ -z "$VALUE" ]]; then
  echo "Abbruch: leerer Wert." >&2
  exit 1
fi

# Meta-Tokens sind base64url-artig. Wir lehnen alles ab, was das Quoting in der
# .env oder beim Transport zerlegen könnte — lieber hier scheitern als eine
# halb geschriebene .env auf Production zu hinterlassen.
if [[ "$VALUE" =~ [[:space:]\'\"\`\$\\] ]]; then
  echo "Abbruch: Wert enthält Leerzeichen oder Sonderzeichen (' \" \` \$ \\)." >&2
  echo "Das deutet meist auf einen Kopierfehler hin — bitte Token erneut kopieren." >&2
  exit 1
fi

printf 'Setze %s auf %s (%d Zeichen, maskiert) … ' \
  "$KEY" "${VALUE:0:4}…${VALUE: -4}" "${#VALUE}" >&2
printf '\n' >&2

# --- Remote-Skript übertragen ----------------------------------------------
# Der Skripttext geht über stdin (kein Interpolieren dank zitiertem Heredoc),
# der Token in einer SEPARATEN Verbindung ebenfalls über stdin. Dadurch steht
# er auf keiner Seite in argv und taucht in keinem `ps` auf.
ssh "$SSH_HOST" "cat > /tmp/tw-set-secret.sh && chmod 700 /tmp/tw-set-secret.sh" <<'REMOTE_SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/funnelflow"
PM2_NAME="funnelflow"
KEY="$1"

read -r VALUE
[[ -n "$VALUE" ]] || { echo "Remote: leerer Wert empfangen." >&2; exit 1; }

cd "$APP_DIR"

[[ -f .env ]] || { echo "Remote: $APP_DIR/.env nicht gefunden." >&2; exit 1; }

BACKUP=".env.bak-$(date +%Y%m%d-%H%M%S)"
cp -p .env "$BACKUP"
echo "Backup: $APP_DIR/$BACKUP"

# Fehlender Zeilenumbruch am Dateiende würde beim Anhängen die letzte Zeile
# mit der neuen verschmelzen.
[[ -n "$(tail -c1 .env)" ]] && printf '\n' >> .env

if grep -q "^${KEY}=" .env; then
  grep -v "^${KEY}=" .env > .env.tmp
  printf '%s=%s\n' "$KEY" "$VALUE" >> .env.tmp
  mv .env.tmp .env
  echo "Aktion: ${KEY} ersetzt"
else
  printf '%s=%s\n' "$KEY" "$VALUE" >> .env
  echo "Aktion: ${KEY} neu angelegt"
fi

chmod 600 .env

# .env exportieren und PM2 MIT --update-env neu starten. Ohne das übernimmt
# PM2 die neue Variable nicht.
set -a
# shellcheck disable=SC1091
source .env
set +a
pm2 restart "$PM2_NAME" --update-env >/dev/null
echo "PM2: $PM2_NAME mit --update-env neu gestartet"

sleep 2
for i in $(seq 1 15); do
  if curl -sf http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "Health: OK"
    break
  fi
  [[ $i -eq 15 ]] && { echo "Health: FEHLGESCHLAGEN — .env-Backup liegt unter $BACKUP" >&2; exit 1; }
  sleep 2
done

if pm2 env 0 2>/dev/null | grep -q "^${KEY}:"; then
  echo "Verifikation: ${KEY} ist im Prozess sichtbar"
else
  echo "Verifikation: ${KEY} NICHT im Prozess sichtbar — bitte melden" >&2
  exit 1
fi
REMOTE_SCRIPT

# --- Token separat über stdin schicken und Skript ausführen -----------------
printf '%s\n' "$VALUE" | ssh "$SSH_HOST" \
  "bash /tmp/tw-set-secret.sh '$KEY'; rc=\$?; rm -f /tmp/tw-set-secret.sh; exit \$rc"

echo
echo "Fertig. $KEY ist auf Production gesetzt und aktiv."
