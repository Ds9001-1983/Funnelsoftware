# Launch-Ops: Status

Stand: 11.06.2026, nach der Ops-Übernahme. Fast alles ist erledigt und
verifiziert — offen sind nur noch die vier Punkte unter „Offen".

## Erledigt ✅

| Punkt | Status |
|---|---|
| Alle Audit-PRs gemergt (#116–#129) | ✅ live, jedes Deploy grün, Health 200 |
| DB-Schema (neue Spalten + Indizes) | ✅ in Produktion verifiziert |
| PM2-Logs geflusht (alte PII/Tokens entfernt) | ✅ |
| pm2-logrotate (20 MB, 14 Tage, komprimiert) | ✅ |
| nginx `client_max_body_size 60m` | ✅ |
| `SESSION_SECRET` rotiert | ✅ |
| `ADMIN_PASSWORD` rotiert | ✅ neues PW in `~/Desktop/TRICHTERWERK-NEUE-ZUGAENGE.txt` |
| DB-Passwort rotiert | ✅ ALTER USER + .env, Health grün |
| `STRIPE_WEBHOOK_SECRET` rotiert | ✅ neuer Endpoint `we_1Th7yF…`, alter gelöscht, jetzt 5 Events (inkl. `charge.dispute.created`) |
| Stripe Tax | ✅ DE-Registrierung aktiv, Price auf `inclusive` (49 € bleibt Endpreis), `STRIPE_TAX_ENABLED=true`, Checkout-Dry-Run ok |
| Stripe Customer-Portal | ✅ war bereits korrekt (Kündigung, Rechnungen, Zahlungsmethoden) |
| Dunning | ✅ Code-Fallback (PR #129): Abo wird nach dem 4. Fehlversuch serverseitig gekündigt |
| Uptime-Monitoring | ✅ GitHub-Actions-Workflow alle 5 Min auf `/api/health`, Failure-Mail an Repo-Owner, Testlauf grün |
| Backups: uploads/ mitsichern | ✅ in `backup.sh` |
| Offsite-Backup | ✅ täglicher Pull auf den Mac (launchd 10:30, `~/TrichterwerkBackups/`), erster Pull verifiziert |
| Restore-Test | ✅ Backup in Temp-DB eingespielt, alle Zeilen-Counts identisch mit Produktion |
| End-to-End-Test (Live) | ✅ Registrierung → Verifikation → Funnel → Publish → Public-Abruf (interaktive Radios) → Lead mit Einwilligungsnachweis → Trial-Ablauf liefert 410 → Self-Service-Kontolöschung mit voller Kaskade |

## Offen ⚠️ (braucht Dennis)

1. **STRIPE_SECRET_KEY rollen** (einzige technisch nicht per API mögliche Rotation):
   https://dashboard.stripe.com/acct_1TFYnAALTQRcr9ei/apikeys → „Roll key" →
   neuen Key in `~/Desktop/stripe-key.txt` legen → Claude Bescheid sagen
   (liest die Datei, schreibt sie in die Server-.env, verifiziert, löscht die Datei).
   Danach: `~/Desktop/TRICHTERWERK-SECRETS-TO-ROTATE.md` löschen.
2. **Echter Kauf-Test** (empfohlen): einmal Live-Checkout mit echter Karte —
   Claude überwacht den Webhook, refundiert sofort und kündigt die Test-Subscription.
3. **Meta-CAPI-Field-Test** (optional, CAPI bleibt bis dahin für Kunden aus):
   Events Manager → Datenquellen → Pixel auswählen → Einstellungen →
   Conversions API → „Access Token generieren" → Token in
   `~/Desktop/meta-capi-token.txt` legen → Claude macht den Test.
4. **AVV + Datenschutzerklärung** juristisch gegenlesen lassen (`/avv`, `/datenschutz`).

## Referenz

- Health-Check: https://trichterwerk.de/api/health
- Uptime-Workflow: `.github/workflows/uptime.yml`
- Server-Backups: `/var/backups/funnelflow/` (30 Tage), Mac: `~/TrichterwerkBackups/` (14 Tage)
- Restore: `gunzip -c db_DATUM.gz | sudo -u postgres psql <zieldb>`
