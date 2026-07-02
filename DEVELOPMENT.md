# Lokales Setup (VS Code)

Kurzanleitung, um Trichterwerk lokal zu starten — ohne Replit-/Hosting-Magie.

## Voraussetzungen

- **Node.js 18+**
- **PostgreSQL 14+** lokal **oder** ein Connection-String von einem Managed-Anbieter (z. B. Supabase/Neon)

## 1. Umgebungsvariablen

`.env` aus der Vorlage anlegen und ausfüllen:

```bash
cp .env.example .env
```

In der `.env` setzen:

- `DATABASE_URL` — z. B. `postgresql://user:pass@localhost:5432/funnelflow`
- `SESSION_SECRET` — beliebiger langer Zufallsstring
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — Login fürs Admin-Panel
- `PORT` (optional, Default `5000`), `NODE_ENV=development`

Die `.env` wird über `dotenv` automatisch geladen (`import "dotenv/config"` ganz oben in `server/index.ts`) und ist in `.gitignore` — **nicht committen**. In Production gesetzte echte Env-Vars haben Vorrang (dotenv überschreibt sie nicht).

## 2. Abhängigkeiten installieren

```bash
npm install
```

## 3. Datenbank-Schema anlegen

```bash
npm run db:push
```

Legt die Tabellen aus `shared/schema.ts` in der DB an (Drizzle).

## 4. Dev-Server starten

```bash
npm run dev
```

Läuft auf **http://localhost:5000**.

## Hinweise

- **Erster Account:** Über `/register` registrieren. Der erste registrierte User ist der Haupt-Account.
- **Admin-Panel:** `/admin`, Login mit `ADMIN_USERNAME` / `ADMIN_PASSWORD` aus der `.env`.
- **TypeScript-Check:** `npm run check`
- **Tests:** `npm run test:run` (CI führt sie zuverlässig aus; lokal kann der Vitest-Worker je nach Umgebung Probleme beim Forken haben — dann auf `npm run check` stützen).
- **End-to-End-Tests (Playwright):** einmalig `npm run test:e2e:install` (Browser herunterladen), dann `npm run test:e2e`.
  - **Voraussetzung:** ein lokal laufendes PostgreSQL (z. B. `brew services start postgresql@16`). Die Tests nutzen eine eigene Wegwerf-Datenbank `funnelsoftware_e2e`, die automatisch angelegt und migriert wird — die eigene Dev-DB wird nie angefasst. Abweichende Verbindung per `E2E_DATABASE_URL` setzen.
  - Der Dev-Server wird automatisch auf **Port 5137** gestartet (nicht 5000 — den belegt auf macOS der AirPlay-Receiver), mit deaktiviertem Stripe/SMTP: Registrierung bleibt in der App, der E-Mail-Verifikations-Token wird direkt aus der Test-DB gelesen.
  - `PLAYWRIGHT_NO_SERVER=1` überspringt den verwalteten Server. Dann muss der Zielserver mit **derselben** Datenbank wie `E2E_DATABASE_URL` und ohne Stripe-Keys laufen, sonst lesen die DB-Helper die falsche Datenbank bzw. /register leitet zu Stripe um.
  - Die Suite deckt den kompletten Lebenszyklus ab: Registrieren → E-Mail verifizieren → Funnel erstellen → publizieren → als Besucher ausfüllen → Lead-Persistenz; dazu Lead-Schutz (Honeypot, Dedup) und die Landing-Smoke-Tests.
- **Produktions-Build:** `npm run build`, Start mit `npm start`.
