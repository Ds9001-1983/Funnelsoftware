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
    status: "Im Pro-Plan",
    summary: "Neue Bewerber erhalten auf Wunsch automatisch eine Eingangsbestätigung. Absendername, Betreff und Nachricht legst du pro Funnel fest.",
    comparison: "Ja, im Pro-Plan",
    faq: {
      q: "Kann ich automatische Bestätigungsmails an Bewerber senden?",
      a: "Ja, im Pro-Plan und während der Pro-Testphase. Unter Leads wählst du einen Funnel und öffnest Board & E-Mails. Dort aktivierst du die Eingangsbestätigung und hinterlegst deinen Text mit Platzhaltern für Name, Unternehmen und Funnel. Der Versand erfolgt über Trichterwerk; Antworten gehen an deine bestätigte Account-Adresse. Die Regel gilt für neue Bewerbungen mit E-Mail-Adresse. Den Versandstatus siehst du im Verlauf.",
    },
  },
  {
    id: "kanban",
    label: "Kanban-Board",
    status: "Vorhanden",
    summary: "Bewerbungen je Funnel per Drag-and-drop oder Statusauswahl verwalten. In Pro kannst du bis zu 20 eigene Spalten mit Namen und Farben einrichten.",
    comparison: "Ja, Drag-and-drop; eigene Spalten in Pro",
    faq: {
      q: "Gibt es ein Kanban-Board für meine Bewerber?",
      a: "Ja. Wähle unter Leads einen Funnel für sein Bewerberboard. Bewerbungen verschiebst du per Drag-and-drop oder Statusauswahl; Details und Verlauf sind direkt erreichbar. Du startest mit fünf Spalten. In Pro kannst du pro Funnel zwei bis 20 Spalten mit eigenen Namen und Farben einrichten, zum Beispiel Gespräch oder Absage. Die erste Spalte nimmt neue Bewerbungen auf. Spalten mit Bewerbungen oder gespeicherten Mailregeln bleiben vor dem Löschen geschützt.",
    },
  },
  {
    id: "status-email",
    label: "E-Mails bei Statuswechsel",
    status: "Im Pro-Plan",
    summary: "Aktiviere eine Nachricht für eine Zielspalte, etwa Einladung oder Absage. Ein bestätigter Statuswechsel legt den automatischen Versandauftrag an.",
    comparison: "Ja, im Pro-Plan",
    faq: {
      q: "Kann ein Statuswechsel automatisch eine Einladung oder Absage versenden?",
      a: "Ja, in Pro kannst du für jede Zielspalte eine E-Mail-Regel mit eigenem Text aktivieren. Sie greift bei einem künftigen Statuswechsel, auch durch einen freigegebenen Kunden. Pro Bewerbung und Regel entsteht höchstens ein automatischer Versandauftrag. Das Aktivieren verschickt keine Nachrichten an bestehende Bewerbungen. Antworten gehen an deine bestätigte Account-Adresse; Versandstatus und Statuswechsel stehen im Verlauf.",
    },
  },
  {
    id: "customer-workspace",
    label: "Getrennte Kunden-Workspaces",
    status: "Im Pro-Plan",
    summary: "Gib ausgewählte Funnel-Boards für einen Kunden frei. Eingeladene Personen sehen die zugehörigen Bewerbungen und dürfen deren Status ändern, ohne eigenes Pro-Abo.",
    comparison: "Pro: getrennte Kundenbereiche für Bewerberboards",
    faq: {
      q: "Hat mein Kunde einen eigenen Workspace?",
      a: "Ja. Unter Kundenbereiche legst du in Pro getrennte Bereiche an, ordnest eigene Funnels zu und lädst Kunden per E-Mail ein. Nach Anmeldung, E-Mail-Bestätigung und Annahme sehen sie nur die zugeordneten Bewerbungen und können deren Status ändern. Kunden benötigen kein eigenes Pro-Abo. Editor, Mailregeln und Abrechnung verwaltest weiterhin du. Ein Funnel gehört höchstens einem Kundenbereich an. Du kannst Zugänge jederzeit entziehen, ohne Funnels oder Bewerbungen zu löschen.",
    },
  },
] as const;

export const recruitingFaqs: SeoFaq[] = recruitingCapabilities.map(({ faq }) => faq);
