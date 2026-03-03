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
│   │   │   ├── funnel-editor/  # Editor-spezifische Komponenten (28)
│   │   │   │   ├── PageEditor.tsx           # Seiten-Editor mit Sektionen
│   │   │   │   ├── ElementPreviewRenderer.tsx   # Element-Vorschau Rendering
│   │   │   │   ├── ElementPropertiesPanel.tsx   # Eigenschaften-Panel
│   │   │   │   ├── ElementWrapper.tsx       # Element-Container
│   │   │   │   ├── PhonePreview.tsx         # Mobile Vorschau
│   │   │   │   ├── QuizElement.tsx          # Quiz mit Ergebnis-Mapping
│   │   │   │   ├── DevicePreview.tsx        # Mobile/Tablet/Desktop Vorschau
│   │   │   │   ├── ABTestEditor.tsx         # A/B-Test Konfiguration
│   │   │   │   ├── ConditionalLogicEditor.tsx   # Bedingte Logik
│   │   │   │   ├── NavigatorPanel.tsx       # Seiten/Element Navigator
│   │   │   │   ├── FloatingToolbar.tsx      # Schwebende Toolbar
│   │   │   │   ├── DraggableElement.tsx     # Drag & Drop Wrapper
│   │   │   │   ├── SectionEditor.tsx        # Sektions-Editor
│   │   │   │   ├── ElementPalette.tsx       # Element-Auswahl Palette
│   │   │   │   ├── FormValidationEditor.tsx # Formular-Validierung
│   │   │   │   └── ...                      # Weitere Editor-Komponenten
│   │   │   ├── TemplateSelector.tsx   # Template-Auswahl Dialog
│   │   │   ├── app-sidebar.tsx        # App Navigation Sidebar
│   │   │   ├── theme-provider.tsx     # Theme Context Provider
│   │   │   ├── theme-toggle.tsx       # Dark/Light Mode Toggle
│   │   │   └── ui/         # shadcn/ui Komponenten (31 Basis-Komponenten)
│   │   ├── hooks/          # Custom React Hooks
│   │   │   ├── use-auth.tsx
│   │   │   ├── use-toast.ts
│   │   │   ├── use-history.tsx
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-document-title.ts
│   │   ├── lib/            # Utilities und Konfiguration
│   │   │   ├── templates.ts       # 10 professionelle Funnel-Templates
│   │   │   ├── queryClient.ts     # TanStack Query Setup
│   │   │   └── utils.ts
│   │   ├── pages/          # Seiten-Komponenten (12 Seiten)
│   │   │   ├── funnel-editor.tsx  # Haupt-Editor (~1500 Zeilen)
│   │   │   ├── admin.tsx          # Admin-Dashboard (Kundenverwaltung)
│   │   │   ├── dashboard.tsx      # Benutzer-Dashboard
│   │   │   ├── analytics.tsx      # Analytics-Dashboard
│   │   │   ├── funnels.tsx        # Funnel-Liste
│   │   │   ├── leads.tsx          # Lead-Verwaltung
│   │   │   ├── settings.tsx       # Benutzer-Einstellungen
│   │   │   ├── new-funnel.tsx     # Neuen Funnel erstellen
│   │   │   ├── landing.tsx        # Landing Page
│   │   │   ├── login.tsx          # Login-Seite
│   │   │   ├── register.tsx       # Registrierungs-Seite
│   │   │   └── not-found.tsx      # 404-Seite
│   │   └── test/           # Test-Utilities und Setup
│   └── public/             # Statische Assets
├── server/                 # Backend-API
│   ├── index.ts           # Server-Einstiegspunkt
│   ├── auth.ts            # Authentifizierung (Passport.js)
│   ├── db.ts              # Datenbankverbindung
│   ├── routes.ts          # API-Routen
│   ├── storage.ts         # Datenbankoperationen
│   ├── static.ts          # Statische Dateien
│   └── vite.ts            # Vite Dev-Server Integration
├── shared/                 # Gemeinsamer Code
│   └── schema.ts          # Zod-Schemas und TypeScript-Typen
└── deploy/                 # Deployment-Konfiguration
```

## Template-System

Die Templates befinden sich in `/client/src/lib/templates.ts` und beinhalten **10 professionelle vorgefertigte Funnels**:

| Template | Kategorie | Beschreibung |
|----------|-----------|--------------|
| Termin | Leads | Terminbuchung mit Qualifizierungsfragen |
| VSL Demo | Sales | Video Sales Letter Demo Funnel |
| Recruiting | Recruiting | Recruiting-Qualifizierungs-Funnel |
| Leadmagnet | Leads | Lead-Magnet Capture Funnel |
| Masterclass | Webinar | Masterclass-Registrierung |
| Immobilien | Leads | Immobilien-Bewertungs-Funnel |
| Onboarding | Leads | Agentur-Onboarding-Funnel |
| Quiz | Quiz | Quiz-basierter Funnel mit Ergebnis-Mapping |
| Sales | Sales | Coaching-Verkaufs-Funnel |
| Survey | Survey | Kundenumfrage-Funnel |

**Kategorien**: Leads (4), Sales (2), Recruiting (1), Webinar (1), Quiz (1), Survey (1)

## Editor-Komponenten

### Kern-Komponenten

| Komponente | Beschreibung |
|------------|--------------|
| `PageEditor.tsx` | Haupt-Editor für Seiten mit Sektionen und Elementen |
| `ElementPreviewRenderer.tsx` | Rendert alle Element-Typen für die Vorschau |
| `ElementPropertiesPanel.tsx` | Konfigurationsbereich für Element-Eigenschaften |
| `ElementWrapper.tsx` | Container mit Auswahl und Aktionen |
| `PhonePreview.tsx` | Mobile-Geräte-Vorschau |

### Unterstützte Element-Typen

- **Text-Elemente**: Headline, Text, Button
- **Medien**: Image, Video, Icon
- **Formulare**: Input, Textarea, Form, Quiz
- **Layout**: Divider, Spacer, ProgressBar
- **Interaktiv**: Timer, Slider, SocialProof

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

### Vorhandene Tests

- `funnel-editor/FunnelProgress.test.tsx` - Fortschrittsanzeige
- `funnel-editor/QuizElement.test.ts` - Quiz-Komponente
- `funnel-editor/constants.test.ts` - Editor-Konstanten
- `lib/templates.test.ts` - Template-Validierung

## Datenbank-Schema

Die wichtigsten Tabellen sind:

- **users**: Benutzerkonten mit Authentifizierung und Subscription-Status
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

### Admin (geschützt)
- `GET /api/admin/users` - Alle Benutzer abrufen
- `PATCH /api/admin/users/:id` - Benutzer aktualisieren
- `DELETE /api/admin/users/:id` - Benutzer löschen
- `GET /api/admin/stats` - Admin-Statistiken

### Öffentlich
- `GET /api/public/funnels/:uuid` - Veröffentlichten Funnel anzeigen
- `POST /api/public/leads` - Lead erstellen
- `POST /api/public/analytics` - Analytics-Event tracken

## Bekannte Einschränkungen

1. **Große Komponenten**: `PageEditor.tsx` (~1100 Zeilen) und `ElementPropertiesPanel.tsx` (~1000 Zeilen) könnten weiter aufgeteilt werden.
2. **Bildoptimierung**: Template-Bilder in `/client/public/templates/` sind nicht optimiert.
3. **E2E-Tests**: Noch nicht implementiert.

## Hinweise für KI-Assistenten

1. **Vor Änderungen**: Lies immer zuerst die relevanten Dateien, um den Kontext zu verstehen.
2. **Tests**: Schreibe Tests für neue Funktionen und führe bestehende Tests aus.
3. **Typen**: Nutze die Zod-Schemas in `shared/schema.ts` für Validierung.
4. **Commits**: Verwende aussagekräftige Commit-Messages auf Deutsch oder Englisch.
5. **Branch-Strategie**: Arbeite auf Feature-Branches, nicht direkt auf `main`.
6. **Bundle-Optimierung**: Templates nutzen Code-Splitting (Lazy Loading).

## Kontakt

Dieses Projekt wird von **SUPERBRAND.marketing** entwickelt.
- Website: https://superbrand.marketing
- Inhaber: Dennis Sasse
