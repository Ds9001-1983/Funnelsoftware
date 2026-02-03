# CLAUDE.md - KI-Entwicklungsrichtlinien für Funnelsoftware

Dieses Dokument enthält wichtige Informationen für KI-Assistenten (wie Claude), die an diesem Projekt arbeiten.

## Projektübersicht

**Funnelsoftware** ist eine SaaS-Anwendung zur Erstellung von Marketing-Funnels. Die Software ermöglicht es Benutzern, mehrstufige Funnels mit einem Drag-and-Drop-Editor zu erstellen, Leads zu sammeln und Analysen einzusehen.

### Technologie-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | Express.js, TypeScript, Passport.js |
| Datenbank | PostgreSQL mit Drizzle ORM |
| State Management | TanStack Query (React Query) |
| UI-Komponenten | Radix UI, shadcn/ui |
| Drag & Drop | dnd-kit |
| Validierung | Zod |
| Tests | Vitest, Testing Library |

## Projektstruktur

```
/
├── client/                 # Frontend-Anwendung
│   ├── src/
│   │   ├── components/     # Wiederverwendbare Komponenten
│   │   │   ├── funnel-editor/  # Editor-spezifische Komponenten
│   │   │   └── ui/         # shadcn/ui Komponenten
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── lib/            # Utilities und Konfiguration
│   │   ├── pages/          # Seiten-Komponenten
│   │   └── test/           # Test-Utilities und Setup
│   └── public/             # Statische Assets
├── server/                 # Backend-API
│   ├── auth.ts            # Authentifizierung (Passport.js)
│   ├── db.ts              # Datenbankverbindung
│   ├── routes.ts          # API-Routen
│   └── storage.ts         # Datenbankoperationen
├── shared/                 # Gemeinsamer Code
│   └── schema.ts          # Zod-Schemas und TypeScript-Typen
└── deploy/                 # Deployment-Konfiguration
```

## Wichtige Konventionen

### Code-Stil

1. **TypeScript**: Alle Dateien verwenden TypeScript. Vermeide `any`-Typen.
2. **Komponenten**: Funktionale Komponenten mit Hooks bevorzugen.
3. **Imports**: Verwende Path-Aliase (`@/` für client/src, `@shared/` für shared).
4. **Sprache**: UI-Texte sind auf Deutsch, Code-Kommentare können Deutsch oder Englisch sein.

### Datei-Benennung

- Komponenten: `PascalCase.tsx` (z.B. `FunnelProgress.tsx`)
- Utilities: `camelCase.ts` (z.B. `queryClient.ts`)
- Tests: `*.test.ts` oder `*.test.tsx`
- Konstanten: `constants.ts`

### Komponenten-Struktur

Neue Komponenten sollten diesem Muster folgen:

```tsx
import { ... } from "...";

interface ComponentNameProps {
  // Props mit JSDoc-Kommentaren
}

/**
 * Kurze Beschreibung der Komponente.
 */
export function ComponentName({ ... }: ComponentNameProps) {
  // Implementation
}
```

## Entwicklungs-Workflow

### Befehle

```bash
# Entwicklungsserver starten
npm run dev

# TypeScript-Prüfung
npm run check

# Tests ausführen
npm run test          # Watch-Modus
npm run test:run      # Einmalig
npm run test:coverage # Mit Coverage

# Datenbank-Schema aktualisieren
npm run db:push

# Produktions-Build
npm run build
```

### Tests schreiben

Tests befinden sich neben den Komponenten mit der Endung `.test.ts(x)`.

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("beschreibt das erwartete Verhalten", () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText("...")).toBeInTheDocument();
  });
});
```

## Datenbank-Schema

Die wichtigsten Tabellen sind:

- **users**: Benutzerkonten mit Authentifizierung
- **funnels**: Funnel-Definitionen mit Seiten und Theme
- **leads**: Gesammelte Kontaktdaten aus Funnels
- **templates**: Vorgefertigte Funnel-Templates
- **analytics_events**: Tracking-Events für Analysen

Schema-Änderungen werden in `shared/schema.ts` definiert und mit `npm run db:push` angewendet.

## API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Neuen Benutzer registrieren
- `POST /api/auth/login` - Anmelden
- `POST /api/auth/logout` - Abmelden
- `GET /api/auth/user` - Aktuellen Benutzer abrufen

### Funnels (geschützt)
- `GET /api/funnels` - Alle Funnels des Benutzers
- `GET /api/funnels/:id` - Einzelnen Funnel abrufen
- `POST /api/funnels` - Neuen Funnel erstellen
- `PATCH /api/funnels/:id` - Funnel aktualisieren
- `DELETE /api/funnels/:id` - Funnel löschen

### Öffentlich
- `GET /api/public/funnels/:uuid` - Veröffentlichten Funnel anzeigen
- `POST /api/public/leads` - Lead erstellen
- `POST /api/public/analytics` - Analytics-Event tracken

## Bekannte Einschränkungen

1. **funnel-editor.tsx**: Diese Datei ist noch sehr groß (~2600 Zeilen). Weitere Refactoring-Arbeit ist geplant.
2. **Bildoptimierung**: Template-Bilder in `/client/public/templates/` sind nicht optimiert.
3. **E2E-Tests**: Noch nicht implementiert.

## Hinweise für KI-Assistenten

1. **Vor Änderungen**: Lies immer zuerst die relevanten Dateien, um den Kontext zu verstehen.
2. **Tests**: Schreibe Tests für neue Funktionen und führe bestehende Tests aus.
3. **Typen**: Nutze die Zod-Schemas in `shared/schema.ts` für Validierung.
4. **Commits**: Verwende aussagekräftige Commit-Messages auf Deutsch oder Englisch.
5. **Branch-Strategie**: Arbeite auf Feature-Branches, nicht direkt auf `main`.

## Kontakt

Dieses Projekt wird von **SUPERBRAND.marketing** entwickelt.
- Website: https://superbrand.marketing
- Inhaber: Dennis Sasse
