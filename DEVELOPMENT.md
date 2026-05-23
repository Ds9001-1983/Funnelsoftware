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
- **End-to-End-Tests (Playwright):** einmalig `npm run test:e2e:install` (Browser herunterladen), dann `npm run test:e2e`. Startet automatisch den Dev-Server auf Port 5000 und führt die Smoke-Tests in `tests-e2e/` aus.
- **Produktions-Build:** `npm run build`, Start mit `npm start`.
