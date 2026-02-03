# Funnelsoftware

Eine moderne SaaS-Anwendung zur Erstellung von Marketing-Funnels mit Drag-and-Drop-Editor.

## Features

- **Drag-and-Drop Editor**: Erstelle Funnels visuell mit einem intuitiven Editor
- **Vorgefertigte Templates**: Starte schnell mit professionellen Vorlagen
- **Lead-Management**: Sammle und verwalte Kontaktdaten
- **Analytics**: Verfolge Views, Conversions und mehr
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Dark Mode**: Unterstützung für helles und dunkles Theme

## Technologie-Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Express.js, TypeScript, Passport.js
- **Datenbank**: PostgreSQL mit Drizzle ORM
- **UI**: Radix UI, shadcn/ui
- **Tests**: Vitest, Testing Library

## Schnellstart

### Voraussetzungen

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Repository klonen
git clone https://github.com/Ds9001-1983/Funnelsoftware.git
cd Funnelsoftware

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeite .env mit deinen Datenbankdaten

# Datenbank-Schema erstellen
npm run db:push

# Entwicklungsserver starten
npm run dev
```

Die Anwendung ist dann unter `http://localhost:5000` erreichbar.

## Entwicklung

### Verfügbare Scripts

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet den Entwicklungsserver |
| `npm run build` | Erstellt einen Produktions-Build |
| `npm run start` | Startet den Produktionsserver |
| `npm run check` | Führt TypeScript-Prüfung durch |
| `npm run test` | Startet Tests im Watch-Modus |
| `npm run test:run` | Führt Tests einmalig aus |
| `npm run test:coverage` | Erstellt Test-Coverage-Report |
| `npm run db:push` | Aktualisiert das Datenbank-Schema |

### Projektstruktur

```
├── client/           # Frontend (React)
│   ├── src/
│   │   ├── components/   # UI-Komponenten
│   │   ├── hooks/        # Custom Hooks
│   │   ├── lib/          # Utilities
│   │   ├── pages/        # Seiten
│   │   └── test/         # Test-Setup
│   └── public/       # Statische Assets
├── server/           # Backend (Express)
├── shared/           # Gemeinsame Typen/Schemas
└── deploy/           # Deployment-Konfiguration
```

### Tests

Tests werden mit Vitest und Testing Library geschrieben:

```bash
# Tests im Watch-Modus
npm run test

# Einmalige Ausführung
npm run test:run

# Mit Coverage
npm run test:coverage
```

## Umgebungsvariablen

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DATABASE_URL` | PostgreSQL-Verbindungs-URL | `postgresql://user:pass@localhost:5432/db` |
| `SESSION_SECRET` | Secret für Session-Verschlüsselung | `dein-geheimes-secret` |
| `PORT` | Server-Port (optional) | `5000` |
| `NODE_ENV` | Umgebung | `development` oder `production` |

## KI-Entwicklung

Dieses Projekt ist für die Zusammenarbeit mit KI-Assistenten optimiert. Siehe [CLAUDE.md](./CLAUDE.md) für detaillierte Richtlinien.

## Lizenz

MIT

## Kontakt

**SUPERBRAND.marketing**
- Website: https://superbrand.marketing
- Inhaber: Dennis Sasse
