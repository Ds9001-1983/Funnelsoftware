/** Geprüfter Funktionsstand für Landingpage, Recruiting und Perspective-Vergleich.
 * Nur veröffentlichbare Produktinformationen; keine Entwicklungszusagen.
 * Leichtes Modul, damit die Landingpage nicht die gesamte SEO-Registry lädt.
 */
import type { SeoFaq } from "./seo-links";

export const recruitingCapabilities = [
  {
    id: "domains",
    label: "Eigene Domains",
    status: "Im Pro-Plan",
    summary: "Mehrere Domains und Subdomains verbinden. Für verifizierte Domains gibt es derzeit keine feste Obergrenze.",
    comparison: "Pro: mehrere Domains, keine feste Obergrenze",
    faq: {
      q: "Wie viele Domains kann ich anbinden?",
      a: "Im Pro-Plan und während der Pro-Testphase kannst du mehrere eigene Domains und Subdomains verbinden. Für verifizierte Domains gibt es derzeit keine feste Obergrenze. Bis zu fünf Einträge pro Account können gleichzeitig auf die Verifizierung warten. Jeder Hostname wird einem Funnel zugeordnet; mehrere Hostnamen können auf denselben Funnel zeigen.",
    },
  },
  {
    id: "confirmation-email",
    label: "Bestätigungsmails an Bewerber",
    status: "Noch nicht verfügbar",
    summary: "Du kannst E-Mail-Benachrichtigungen über neue Bewerbungen erhalten. Automatische Bestätigungen an Bewerber sind noch nicht enthalten.",
    comparison: "Noch nicht verfügbar",
    faq: {
      q: "Kann ich automatische Bestätigungsmails an Bewerber senden?",
      a: "Direkt in Trichterwerk ist das derzeit noch nicht möglich. Die vorhandene E-Mail-Benachrichtigung informiert dich als Funnel-Betreiber über einen neuen Lead. Über den Webhook für neue Leads lässt sich ein externer E-Mail-Dienst anbinden; diese Automation musst du separat einrichten. Eine integrierte Bewerberbestätigung hat noch keinen zugesagten Veröffentlichungstermin.",
    },
  },
  {
    id: "kanban",
    label: "Kanban-Board",
    status: "Vorhanden",
    summary: "Bewerber und Leads in fünf festen Spalten verwalten. Den Status änderst du per Menü; Drag-and-drop und eigene Spalten sind noch nicht enthalten.",
    comparison: "Ja, fünf feste Spalten; Statuswechsel per Menü",
    faq: {
      q: "Gibt es ein Kanban-Board für meine Bewerber?",
      a: "Ja. Die Lead-Verwaltung bietet die fünf Spalten Neu, Kontaktiert, Qualifiziert, Konvertiert und Verloren. Du kannst Kontakte öffnen, nach Funnel filtern und ihren Status per Menü oder Dropdown ändern. Drag-and-drop und eigene Spalten wie Gespräch oder Abgesagt sind derzeit noch nicht verfügbar.",
    },
  },
  {
    id: "status-email",
    label: "E-Mails bei Statuswechsel",
    status: "Noch nicht verfügbar",
    summary: "Ein Statuswechsel im Board versendet derzeit keine E-Mail. Automatische Einladungen oder Absagen sind noch nicht enthalten.",
    comparison: "Noch nicht verfügbar",
    faq: {
      q: "Kann ein Statuswechsel automatisch eine Einladung oder Absage versenden?",
      a: "Derzeit nicht. Ein Statuswechsel im Kanban-Board löst weder eine E-Mail noch einen Status-Webhook aus. Der vorhandene Webhook meldet neue Leads. Automatische Nachrichten bei einem Statuswechsel sind eine mögliche Erweiterung, für die noch kein Veröffentlichungstermin zugesagt ist.",
    },
  },
  {
    id: "customer-workspace",
    label: "Getrennte Kunden-Workspaces",
    status: "Noch nicht verfügbar",
    summary: "Teamverwaltung und Einladungen sind vorhanden. Ein Kundenbereich mit gemeinsamem Zugriff auf ausgewählte Funnels und Bewerber ist noch nicht enthalten.",
    comparison: "Noch nicht verfügbar; Teamverwaltung vorhanden",
    faq: {
      q: "Hat mein Kunde einen eigenen Workspace?",
      a: "Ein eigener Kunden-Workspace mit Zugriff auf ausgewählte Funnels und Bewerber ist derzeit noch nicht verfügbar. Im Pro-Plan kannst du Teams und Einladungen verwalten; dadurch erhalten Mitglieder aktuell jedoch keinen gemeinsamen Zugriff auf deine Funnels und Leads. Für getrennte Kundenbereiche gibt es noch keinen zugesagten Veröffentlichungstermin.",
    },
  },
] as const;

export const recruitingFaqs: SeoFaq[] = recruitingCapabilities.map(({ faq }) => faq);
