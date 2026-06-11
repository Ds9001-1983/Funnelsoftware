# Launch-Ops: Manuelle Schritte vor der Vermarktung

Stand: 11.06.2026 — Ergebnis des Launch-Audits. Diese Schritte kann kein PR
erledigen, sie passieren auf dem Server bzw. in externen Dashboards.
Reihenfolge ist Priorität.

## 1. Secrets rotieren (SOFORT — P0)

Beim Deploy am 25.05.2026 wurden die `.env`-Werte in ein Conversation-Log
gespült. Anleitung: `~/Desktop/TRICHTERWERK-SECRETS-TO-ROTATE.md` (nach
Rotation löschen). Zu rotieren:

- [ ] Stripe Live-Keys (`STRIPE_SECRET_KEY`, danach Webhook-Secret neu)
- [ ] DB-Passwort (`DATABASE_URL`) — danach `pm2 restart funnelflow --update-env`
- [ ] `SESSION_SECRET` (loggt alle Nutzer aus — einmalig okay)
- [ ] `ADMIN_PASSWORD`

## 2. PM2-Logs bereinigen + Rotation (P0)

Die alten Logs enthalten Lead-PII, CAPI-Tokens und Webhook-Secrets
(Response-Body-Logging, gefixt in PR #116):

```bash
pm2 flush funnelflow
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

## 3. nginx: Upload-Limit (P0 — sonst 413 bei Uploads >1 MB)

In `/etc/nginx/sites-available/funnelflow` im `location /api/`-Block (bzw.
server-Block) ergänzen, dann `nginx -t && systemctl reload nginx`:

```nginx
client_max_body_size 60m;
```

(Audio-Uploads erlauben 50 MB; nginx-Default ist 1 MB.)

## 4. Stripe-Dashboard (vor Launch)

- [ ] **Stripe Tax aktivieren**: Dashboard → Steuern → Ursprungsadresse +
      DE-Steuerregistrierung. DANACH `STRIPE_TAX_ENABLED=true` in `.env`
      (PR #117) — vorher schlägt die Checkout-Erstellung fehl!
- [ ] **Dunning konfigurieren**: Einstellungen → Abonnements → fehlgeschlagene
      Zahlungen → nach den Smart Retries **Abo kündigen** (sonst bleibt
      `past_due` mit Vollzugriff ewig bestehen).
- [ ] **Customer-Portal** prüfen: Kündigung erlaubt, Rechnungshistorie an.
- [ ] Test-Mode-Durchlauf: Doppel-Checkout (muss 400 liefern), Trial-Upgrade
      (Trial-Ende bleibt erhalten), Portal-Kündigung, `invoice.payment_failed`,
      Dispute — Status in der DB prüfen.

## 5. Monitoring (vor Launch)

- [ ] Sentry-Projekt anlegen (sentry.io) → `SENTRY_DSN` in `.env` (PR #125)
- [ ] UptimeRobot (o. ä.) auf `https://trichterwerk.de/api/health`
      (prüft DB-Verbindung; 503 = Alarm)

## 6. Backups (vor Launch)

Aktuell: tägliches DB-Backup nach `/var/backups/funnelflow/` (nur lokal!).

- [ ] **Offsite-Kopie**: Hetzner Storage Box buchen, `backup.sh` um
      `rsync`/`borg` auf die Box erweitern
- [ ] **uploads/ mitsichern** (`/var/www/funnelflow/uploads`) — Kundendaten!
- [ ] **Restore einmal testen** (auf leerer DB einspielen, App starten)

## 7. Meta-CAPI-Field-Test (vor Aktivierung für Kunden)

Mit Test-Token im Meta Events Manager: Test-Funnel mit Pixel-ID + Token,
Lead mit Marketing-Consent absenden, Event im Events Manager prüfen
(Match-Quality der gehashten Felder kontrollieren — Telefon jetzt mit
Ländervorwahl, PR #126).

## 8. Rechtliches (vor Launch)

- [ ] AVV (`/avv`) und erweiterte Datenschutzerklärung (PR #120) juristisch
      gegenlesen lassen; Subprocessor-Angaben verifizieren (Hetzner = Hosting,
      Alfahosting = SMTP, Stripe, Meta, Google)
- [ ] AGB auf Self-Service-Abo prüfen (Trial, Kündigung, Preise)

## 9. Merge-Reihenfolge der Audit-PRs

#116, #117, #118, #119 sind unabhängig (von main). Danach der Stack in
Reihenfolge: #120 → #121 → #122 → #123 → #124 → #125 → #126. GitHub
retargetet die Base automatisch nach jedem Merge. Jeder Merge deployt
automatisch (inkl. db:push).

Schema-Änderungen über die PRs: `funnels.impressum_url`, `funnels.datenschutz_url`,
`leads.marketing_consent`, `leads.consent_at`, `users.lead_notifications_enabled`,
Indizes `users_stripe_customer_id_idx`, `session_expire_idx`.

## 10. Finaler End-to-End-Durchlauf (Launch-Gate)

Frische Registrierung → Verifizierungs-Mail → Checkout (Test-Karte) →
Funnel aus Template "Termin" → alle Fragetypen beantworten → publishen →
Lead über Live-URL (inkl. Consent) → Lead-Mail + Export prüfen →
Kündigung im Portal → nach Trial+7 Tagen Grace: Funnel-URL liefert 410.
