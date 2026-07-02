#!/usr/bin/env bash
# Trichterwerk Custom-Domain-Provisioner
#
# Läuft minütlich als root via systemd-Timer (domain-provisioner.timer).
# Stellt für verifizierte Domains (ssl_status='pending') Let's-Encrypt-
# Zertifikate aus, rendert nginx-vhosts und räumt gelöschte Domains ab.
# Installation & Troubleshooting: deploy/CUSTOM_DOMAINS.md.
#
#   DRY_RUN=1 domain-provisioner.sh          → nur loggen, nichts ändern
#   CERTBOT_EXTRA_ARGS=--staging …           → Let's-Encrypt-Staging (Tests)
set -euo pipefail

# ---------- Konfiguration ----------
ENV_FILE="/var/www/funnelflow/.env"
WEBROOT="/var/www/letsencrypt"
VHOST_DIR="/etc/nginx/customer-domains"
TEMPLATE="/etc/nginx/customer-domain-vhost.template"
STATE_DIR="/var/lib/domain-provisioner"   # DNS-Fehlversuchs-Zähler pro Host
LOCK_FILE="/run/domain-provisioner.lock"
SERVER_IPV4="116.203.40.49"
CNAME_TARGET="trichterwerk.de"
# Externer Resolver ≈ Sicht von Let's Encrypt, nicht der lokale Server-Cache.
DNS_RESOLVER="1.1.1.1"
# 10 Läufe ≈ 10 Minuten Toleranz für DNS-Propagation, danach ssl_status='error'
# (der Kunde stößt per „Erneut prüfen" einen neuen Zyklus an).
MAX_DNS_ATTEMPTS=10
DRY_RUN="${DRY_RUN:-0}"
CERTBOT_EXTRA_ARGS="${CERTBOT_EXTRA_ARGS:-}"

log() { echo "[domain-provisioner] $*"; }   # stdout → journald via systemd
run() { if [[ "$DRY_RUN" == "1" ]]; then log "DRY-RUN: $*"; else "$@"; fi; }

# ---------- Konkurrenz-Schutz ----------
# Läuft noch eine Instanz (z. B. langsames certbot), beendet sich dieser
# Lauf sofort — der Timer triggert in 60 s erneut.
exec 9>"$LOCK_FILE"
flock -n 9 || { log "Andere Instanz läuft — überspringe."; exit 0; }

# ---------- DATABASE_URL laden ----------
# Bewusst kein `source`: die .env kann Werte mit Shell-Sonderzeichen enthalten.
DATABASE_URL="$(grep -m1 '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
[[ -n "$DATABASE_URL" ]] || { log "FEHLER: DATABASE_URL nicht in $ENV_FILE"; exit 1; }

# Verbindung früh prüfen: Eine stillschweigend fehlschlagende Cleanup-Query
# würde sonst ALLE Kunden-vhosts als „nicht mehr in DB" behandeln und löschen.
psql "$DATABASE_URL" -qtAc "SELECT 1" >/dev/null || { log "FEHLER: DB nicht erreichbar"; exit 1; }

# ssl_status-Update mit psql-Variablen statt String-Interpolation im SQL —
# der Hostname ist zwar regex-validiert, aber Gürtel UND Hosenträger.
set_status() { # $1=host $2=status
  run psql "$DATABASE_URL" -q -v h="$1" -v s="$2" \
    -c "UPDATE domains SET ssl_status = :'s' WHERE hostname = :'h';"
}

# ---------- Hostname-Validierung ----------
# Gleiche Regel wie hostnameRegex in shared/schema.ts, plus Blockliste:
# eigene Plattform-Hosts (auch Subdomains!) niemals provisionieren.
valid_host() { # $1=host
  local h="$1"
  (( ${#h} >= 3 && ${#h} <= 253 )) || return 1
  [[ "$h" =~ ^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$ ]] || return 1
  [[ "$h" == "$CNAME_TARGET" || "$h" == *".$CNAME_TARGET" ]] && return 1
  return 0
}

# ---------- Preflight-DNS ----------
# Prüft mit externem Resolver, ob die Domain wirklich auf uns zeigt, BEVOR
# certbot läuft — schützt das Let's-Encrypt-Limit (5 Fehlversuche/h/Host).
# `dig +short A` folgt CNAME-Ketten und listet am Ende die IPs.
preflight_dns() { # $1=host
  local h="$1" cname a
  cname="$(dig +short CNAME "$h" @"$DNS_RESOLVER" 2>/dev/null | sed 's/\.$//' | head -1 || true)"
  [[ "$cname" == "$CNAME_TARGET" || "$cname" == "www.$CNAME_TARGET" ]] && return 0
  a="$(dig +short A "$h" @"$DNS_RESOLVER" 2>/dev/null || true)"
  grep -qx "$SERVER_IPV4" <<<"$a" && return 0
  return 1
}

# ---------- vhost-Rendering ----------
# Platzhalter __HOSTNAME__ statt ${…}, damit nginx-eigene $variablen im
# Template unangetastet bleiben. Hostname ist regex-validiert (keine
# sed-Sonderzeichen möglich).
render_vhost() { # $1=host
  sed "s/__HOSTNAME__/$1/g" "$TEMPLATE"
}

mkdir -p "$STATE_DIR" "$VHOST_DIR"

# ---------- Provisionierungs-Pass ----------
PENDING_RAW="$(psql "$DATABASE_URL" -qtAc "SELECT hostname FROM domains WHERE verified = true AND ssl_status = 'pending' ORDER BY hostname;")" \
  || { log "FEHLER: DB-Abfrage (pending) fehlgeschlagen"; exit 1; }
mapfile -t PENDING <<<"$PENDING_RAW"

for host in "${PENDING[@]}"; do
  [[ -n "$host" ]] || continue

  if ! valid_host "$host"; then
    log "$host: ungültiger/reservierter Hostname → error"
    set_status "$host" error
    continue
  fi

  attempts_file="$STATE_DIR/$host.attempts"

  if ! preflight_dns "$host"; then
    attempts=$(( $(cat "$attempts_file" 2>/dev/null || echo 0) + 1 ))
    echo "$attempts" > "$attempts_file"
    if (( attempts >= MAX_DNS_ATTEMPTS )); then
      log "$host: DNS zeigt nach $attempts Versuchen nicht auf uns → error"
      set_status "$host" error
      rm -f "$attempts_file"
    else
      log "$host: DNS noch nicht propagiert (Versuch $attempts/$MAX_DNS_ATTEMPTS) — bleibt pending"
    fi
    continue
  fi
  rm -f "$attempts_file"

  # AAAA-Warnung: nginx lauscht nur auf IPv4. Zeigt ein AAAA-Record der Domain
  # auf einen fremden Server, validiert Let's Encrypt dort und scheitert.
  # (grep ':' filtert echte IPv6-Adressen — dig listet sonst auch CNAME-Ziele.)
  aaaa="$(dig +short AAAA "$host" @"$DNS_RESOLVER" 2>/dev/null | grep ':' || true)"
  [[ -n "$aaaa" ]] && log "WARNUNG: $host hat AAAA-Records ($aaaa) — LE-Validierung kann fehlschlagen"

  # Zertifikat ausstellen: idempotent — existiert ein gültiges, tut certbot
  # dank --keep-until-expiring nichts. Kollidiert der Aufruf mit einem
  # laufenden Renewal (certbot-eigener Lock), bleibt die Domain pending
  # und der nächste Timer-Lauf versucht es erneut.
  # shellcheck disable=SC2086  # CERTBOT_EXTRA_ARGS soll wortgesplittet werden
  if ! run certbot certonly --webroot -w "$WEBROOT" \
        --cert-name "$host" -d "$host" \
        --non-interactive --agree-tos --keep-until-expiring \
        $CERTBOT_EXTRA_ARGS; then
    if [[ -e /var/lib/letsencrypt/.certbot.lock ]]; then
      log "$host: certbot-Lock aktiv (Renewal läuft?) — bleibt pending"
      continue
    fi
    log "$host: certbot fehlgeschlagen → error (Details: /var/log/letsencrypt/letsencrypt.log)"
    set_status "$host" error
    continue
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY-RUN: würde $VHOST_DIR/$host.conf schreiben und nginx reloaden"
    continue
  fi

  # vhost rendern + validieren. Eine kaputte Datei MUSS sofort wieder weg,
  # sonst blockiert sie jeden künftigen reload (auch reguläre Deploys!).
  conf="$VHOST_DIR/$host.conf"
  render_vhost "$host" > "$conf"
  if ! nginx -t 2>/dev/null; then
    rm -f "$conf"
    if nginx -t 2>/dev/null; then
      log "$host: vhost-Datei machte nginx-Config ungültig → entfernt, error"
      set_status "$host" error
      continue
    fi
    # Config war schon VOR unserer Datei kaputt — nicht die Schuld dieser
    # Domain. Abbrechen ohne reload; Status bleibt pending für den Retry.
    log "FEHLER: nginx-Config unabhängig von $host defekt — Lauf abgebrochen"
    exit 1
  fi
  systemctl reload nginx
  set_status "$host" active
  log "$host: provisioniert und aktiv"
done

# ---------- Cleanup-Pass ----------
# vhosts entfernen, deren Domain gelöscht oder nicht mehr verifiziert ist
# (Funnel-Löschung kaskadiert auf domains → hier räumen wir nginx/Certs ab).
KEEP_RAW="$(psql "$DATABASE_URL" -qtAc "SELECT hostname FROM domains WHERE verified = true;")" \
  || { log "FEHLER: DB-Abfrage (Cleanup) fehlgeschlagen"; exit 1; }
mapfile -t KEEP <<<"$KEEP_RAW"

removed=0
for conf in "$VHOST_DIR"/*.conf; do
  [[ -e "$conf" ]] || continue
  host="$(basename "$conf" .conf)"
  if ! printf '%s\n' "${KEEP[@]}" | grep -qx "$host"; then
    log "$host: nicht mehr in DB — entferne vhost + Zertifikat"
    run rm -f "$conf"
    run certbot delete --cert-name "$host" --non-interactive || true
    rm -f "$STATE_DIR/$host.attempts"
    removed=1
  fi
done
if (( removed )) && [[ "$DRY_RUN" != "1" ]]; then
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
  else
    log "FEHLER: nginx -t nach Cleanup fehlgeschlagen — kein reload"
  fi
fi

log "Lauf beendet."
