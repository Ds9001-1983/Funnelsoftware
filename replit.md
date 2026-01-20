# FunnelFlow - Funnel Builder Application

## Overview

FunnelFlow is a German-language marketing funnel builder application designed for creating mobile-optimized lead generation funnels similar to Perspective.co. The application allows users to create multi-step funnels with various page types (welcome, question, multi-choice, contact, calendar, thank you), manage leads, and track analytics. It features a visual drag-and-drop editor for funnel page management and provides 16+ templates for quick funnel creation.

## Recent Changes (January 2026)

### Feature Expansion - Perspective-like Features
- **Video Elements**: YouTube/Vimeo embed support with URL configuration
- **Date/Time Picker**: Date element with optional time selection
- **Dropdown/Select**: Configurable options for form fields
- **Testimonials**: Customer review elements with author, role, and star ratings
- **Image Slider**: Carousel element for welcome pages
- **Page Animations**: Fade, slide, scale, or none transition options
- **Confetti Effect**: Toggle for thank you pages using canvas-confetti library
- **Design Options**: 8 font choices, custom background color, custom text color

### Template Library Expanded
16 templates now available:
1. Lead-Generierung (Lead Generation)
2. Webinar-Anmeldung (Webinar Registration)
3. Interaktives Quiz (Interactive Quiz)
4. Schnell-Bewerbung (Quick Application)
5. Produkt-Verkauf (Product Sales)
6. E-Book Download
7. Event-Anmeldung (Event Registration)
8. Kundenfeedback (Customer Feedback)
9. Newsletter-Anmeldung (Newsletter Signup)
10. Warteliste (Waitlist)
11. Gewinnspiel (Contest)
12. Coaching-Programm (Coaching Program)
13. Dienstleistungs-Anfrage (Service Request)
14. Marktforschung (Market Research)
15. Produkt-Demo (Product Demo)
16. Leerer Funnel (Blank Funnel)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Drag & Drop**: @dnd-kit for sortable funnel page management
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based structure with a sidebar navigation layout. Key pages include Dashboard, Funnels list, Funnel Editor, Leads management, Analytics, and Settings.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON API with `/api/*` routes
- **Server**: HTTP server with development HMR support via Vite middleware
- **Build Process**: esbuild for production bundling with selective dependency bundling

The backend serves both the API and static files in production. In development, Vite middleware handles hot module replacement.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Validation**: Zod schemas with drizzle-zod integration
- **Storage Interface**: Abstract `IStorage` interface in `server/storage.ts` enabling easy database swap

### Core Data Models
- **Users**: Basic authentication with username/password
- **Funnels**: Multi-page marketing funnels with theme customization
- **Leads**: Contact information captured through funnels
- **Analytics Events**: Page views and conversion tracking
- **Templates**: Pre-built funnel templates for quick start

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components including shadcn/ui
│   │   ├── pages/       # Route page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Data storage interface
│   └── vite.ts       # Vite dev server integration
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema and Zod types
└── migrations/       # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle Kit**: Schema push with `npm run db:push`
- **Session Storage**: connect-pg-simple for Express sessions

### UI Framework
- **Radix UI**: Comprehensive set of accessible UI primitives
- **shadcn/ui**: Pre-styled component library (new-york style)
- **Tailwind CSS**: Utility-first CSS with custom theme configuration

### Key Libraries
- **TanStack Query**: Data fetching and caching
- **@dnd-kit**: Drag and drop functionality
- **date-fns**: Date manipulation
- **Zod**: Runtime type validation
- **react-hook-form**: Form state management with @hookform/resolvers

### Development Tools
- **Vite**: Development server and build tool
- **esbuild**: Production server bundling
- **TypeScript**: Full type safety across the stack
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner