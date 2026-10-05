# Custom Domains — vollautomatisches SSL

Kunden können ihre Funnels statt unter `trichterwerk.de/f/<uuid>` unter einer eigenen Domain ausliefern (z. B. `funnel.deine-firma.de`) — **mit nur einem DNS-Eintrag**, SSL wird automatisch ausgestellt (Perspective-UX).

## Funktionsweise

```
Kunde setzt CNAME → App verifiziert per DNS (CNAME/A, TXT-Legacy-Fallback)
                  → domains.verified = true, ssl_status = 'pending'
                              │
systemd-Timer (minütlich) → domain-provisioner.sh (root):
  psql SELECT pending → Preflight-DNS (dig @1.1.1.1)
  → certbot certonly --webroot → vhost aus Template
  → nginx -t && reload → ssl_status = 'active'
                              │
Editor-Panel pollt /api/domains alle 10 s solange pending → Badge „Aktiv"
```

## Kundensicht

1. Im Funnel-Editor → **Eigene Domain**: Hostname eintragen, „Hinzufügen".
2. Beim DNS-Anbieter **einen** Record anlegen:

   | Fall | Typ | Wert |
   |------|-----|------|
   | Subdomain (empfohlen), z. B. `funnel.firma.de` | CNAME | `trichterwerk.de` |
   | Root-Domain, z. B. `firma.de` | A | `116.203.40.49` |

3. Im Editor „Jetzt verifizieren" → Badge „SSL wird eingerichtet" → nach 1–2 Minuten „Aktiv".

Der alte TXT-Record-Flow (`_trichterwerk-verify.<host>`) funktioniert serverseitig weiter als Fallback für Bestandsdomains, wird aber nicht mehr angezeigt.

## Installation auf dem Server (einmalig, als root)

Der Deploy-Workflow kopiert **nichts** nach `/etc` — nach Änderungen an den `deploy/`-Dateien müssen die cp-Schritte wiederholt werden.
Auch `/usr/local/bin/domain-provisioner.sh` wird beim App-Deployment nicht
automatisch aktualisiert. Eine Korrektur im Repository allein ändert den
laufenden Provisioner daher nicht.

```bash
mkdir -p /var/www/letsencrypt /etc/nginx/customer-domains /var/lib/domain-provisioner

cp /var/www/funnelflow/deploy/domain-provisioner.sh /usr/local/bin/
chmod 755 /usr/local/bin/domain-provisioner.sh

cp /var/www/funnelflow/deploy/custom-domain-vhost.template /etc/nginx/
cp /var/www/funnelflow/deploy/domain-provisioner.service /etc/systemd/system/
cp /var/www/funnelflow/deploy/domain-provisioner.timer /etc/systemd/system/

cp /var/www/funnelflow/deploy/letsencrypt-reload-nginx.sh /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# nginx-Config aktualisieren (Achtung: Live-Datei heißt "funnelflow", nicht "trichterwerk")
cp /var/www/funnelflow/deploy/nginx-trichterwerk.conf /etc/nginx/sites-available/funnelflow
nginx -t && systemctl reload nginx

systemctl daemon-reload
systemctl enable --now domain-provisioner.timer
```

## Regressionstest für Statusänderungen

Der Test führt die tatsächliche `set_status`-Funktion mit `psql` gegen eine
isolierte lokale Testdatenbank aus. Er prüft `pending → active/error`,
SQL-Escaping, Abbruch bei SQL-Fehlern und einen Dry-Run ohne Datenänderung
oder Ausgabe der Datenbank-Zugangsdaten. DNS, Certbot und nginx werden dabei
nicht aufgerufen; die echte Zertifikatsausstellung benötigt zusätzlich eine
Testdomain mit passendem DNS-Eintrag.

```bash
DOMAINS_TEST_DATABASE_URL=postgresql://testuser@127.0.0.1:55440/funnelsoftware_e2e \
  npm run test:run -- deploy/domain-provisioner.test.mjs server/domain-verify.test.ts
```

SQL mit `psql`-Variablen muss über stdin/Datei ausgeführt werden, nicht über
`-c`. Für Statusänderungen ist `ON_ERROR_STOP=1` erforderlich, damit ein
SQL-Fehler den Provisioner mit Fehler beendet.

## Prüfung auf dem Server

Vorschau ohne Zertifikats- oder nginx-Änderungen (lokale DNS-Versuchszähler
können dabei fortgeschrieben werden):

```bash
DRY_RUN=1 /usr/local/bin/domain-provisioner.sh
```

Für Experimente gegen das Let's-Encrypt-Staging (zählt nicht in die Rate-Limits):

```bash
CERTBOT_EXTRA_ARGS=--staging /usr/local/bin/domain-provisioner.sh
# danach: certbot delete --cert-name <host>  (Staging-Zert wieder entfernen)
```

## Troubleshooting

| Symptom | Diagnose |
|---------|----------|
| Domain hängt in „SSL wird eingerichtet" | `journalctl -u domain-provisioner.service -n 100` — meist DNS noch nicht propagiert (10 min Toleranz, danach `error`) |
| Badge „SSL-Fehler" | Kunde klickt „Erneut prüfen" (setzt `pending` zurück). Vorher DNS prüfen: `dig +short CNAME <host> @1.1.1.1` |
| certbot-Fehler | `/var/log/letsencrypt/letsencrypt.log`; Let's-Encrypt-Limit: 5 Fehlversuche/Stunde/Hostname |
| AAAA-Falle | Hat die Domain einen IPv6-Record, validiert Let's Encrypt dort — der Server lauscht nur auf IPv4. Kunde muss den AAAA-Record entfernen. Der Provisioner loggt eine Warnung. |
| Timer läuft nicht | `systemctl list-timers domain-provisioner.timer`, `systemctl status domain-provisioner.service` |
| Zertifikats-Renewals | macht `certbot.timer` automatisch (webroot bleibt über den :80-Catch-all erreichbar); Reload via `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` |
| Domain gelöscht, vhost noch da? | Der Cleanup-Pass des nächsten Provisioner-Laufs entfernt vhost + Zertifikat automatisch |

Alle generierten vhosts liegen in `/etc/nginx/customer-domains/<host>.conf` — nicht von Hand editieren (der Cleanup-Pass löscht/erzeugt sie).

**Optionaler Folgeschritt** (nginx ≥ 1.19.4): `listen 443 ssl default_server; ssl_reject_handshake on;` — sauberer Handshake-Abbruch für unbekannte Hosts statt Zertifikats-Warnung mit dem trichterwerk.de-Zert.

## DSGVO-Hinweis

Wenn der Kunde die Domain nutzt, läuft Traffic erst durch dessen DNS und dann durch deinen Server. Datenschutzerklärung & AVV sollten das abdecken (Subprocessor-Klausel: Trichterwerk hostet den Funnel; SUPERBRAND.marketing als Betreiber).
