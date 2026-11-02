# R09/R16 – Öffentliche Datenschutzangaben und Impressum

Stand: 2. November 2026. Grundlage: `dc656a4` (R12 ist bereits produktiv).

## Umfang

R09 ist teilweise umgesetzt: Pauschale Datenschutzgarantien, die Gleichsetzung
von EU-Hosting mit DSGVO-Konformität und unbelegte Datenschutzbewertungen von
Wettbewerbern entfallen. Landingpage, Ratgeber, Vergleiche, Zielgruppenseiten,
Vorlagengalerie, Registrierung sowie Meta-Texte und FAQ-JSON-LD verwenden
konkrete Produktangaben. Die gemeinsamen Texte liegen in
`shared/privacy-copy.ts`; sichtbare FAQs und serverseitige SEO-Ausgabe bleiben
an dieselben Registries angebunden.

Die Angaben unterscheiden Hosting von Anwendung und zentraler Datenbank von
weiteren Zahlungs-, E-Mail-, KI- und kundenseitig eingebundenen Diensten.
Rechtsgrundlagen, Datenschutzhinweise und Aufbewahrungsfristen bleiben vom
jeweiligen Verwendungszweck abhängig. Weder eine automatische Einwilligung
jeder Bewerbung noch Anonymität allein durch Weglassen von Kontaktfeldern
werden versprochen. Die Express-Bewerbung enthält keine Garantie mehr, dass
der bisherige Arbeitgeber nichts erfährt; Poster und beide Videoformate sind
entsprechend neu erzeugt. Versionierte Vorschau-URLs verhindern, dass der
30-Tage-Cache weiterhin alte Texte ausliefert. Gespeicherte Kunden-Funnels werden nicht migriert.

Die Admin-Beschreibung der Plattformstatistik berücksichtigt den bereits
implementierten Widerspruch, DNT und GPC. Die in R12 festgelegte Aufbewahrung
von **90 Tagen** wird durch dieses Paket nicht geändert.

R16 ist hinsichtlich der überholten öffentlichen Rechtsverweise umgesetzt:
§ 5 DDG ersetzt § 5 TMG, der RStV-Verweis entfällt bei fortbestehender Nennung
des redaktionell Verantwortlichen. Der Hinweis auf die eingestellte
OS-Plattform und die pauschalen Haftungsausschlüsse mit §§ 7–10 TMG entfallen.
Hinweise auf beanstandete Inhalte und Links werden an die vorhandene
Kontaktadresse verwiesen. Dies ersetzt nicht das noch offene DSA-Paket R14.

Bei der mobilen Sichtprüfung festgestellte Überläufe wurden in der gemeinsamen
Marketing-Navigation, dem Ratgeber-CTA und der Vorlagen-Detailansicht behoben.

## Nachweise und Grenzen

- Hosting: vorhandene Anbieterangaben in `client/src/pages/avv.tsx`, produktiver
  Hetzner-Betrieb mit zentraler PostgreSQL-Datenbank; keine Aussage über alle
  Verarbeitungsorte anderer Dienste oder Zertifizierung.
- Rechtslinks: Publikationsprüfung in `shared/funnel-legal.ts` und den
  Veröffentlichungsrouten; die Texte behaupten keine Rechtsprüfung der Inhalte.
- Optionale Einwilligungen: `shared/privacy-consent.ts`,
  `server/marketing-consent.ts`, `server/privacy-routes.ts` und Funnel-Renderer.
- Export: `server/subject-export.ts`, Lead-Export im Dashboard.
- Kundengesteuerte Aufbewahrung: `server/retention-routes.ts`, bestehende
  Aufbewahrungsfunktionen; es wird keine automatische Standardfrist suggeriert.
- Plattformstatistik: `shared/platform-privacy.ts`, `server/platform-retention.ts`.

Primärquellen, abgerufen am 2. November 2026:

- [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html): aktuelle allgemeine Informationspflichten.
- [EU-Kommission zur Einstellung der OS-Plattform](https://consumer-redress.ec.europa.eu/site-relocation_en): Ende am 20. Juli 2025.
- [Verordnung (EU) 2024/3228](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R3228): Aufhebung der ODR-Verordnung.
- [§ 18 MStV](https://www.gesetze-bayern.de/Content/Document/MStV-18): redaktionelle Verantwortlichkeit hängt vom Angebot ab; die neue Überschrift behauptet keine abschließende rechtliche Einordnung.

**Weiter offen:** R09 umfasst zusätzlich eine datierte Prüfung aller
Wettbewerbertarife, Features und sonstigen Vergleichsbehauptungen anhand von
Primärquellen. Dieses Paket bestätigt diese Aussagen nicht. Bei R16 sind
Firmenbezeichnung, ladungsfähige Anschrift und Steuerangaben weiterhin mit
aktuellen Betreiberunterlagen abzugleichen; vorhandene Angaben wurden nicht
geändert oder als unabhängig verifiziert gekennzeichnet. Keine vollständige
rechtliche Freigabe von R09/R16 oder des Gesamtangebots.

## Prüfung und Auslieferung

- Typprüfung für Anwendung und Tests bestanden.
- 537 bestehende Tests bestanden; 160 datenbankabhängige Tests lokal ohne
  Datenbankkonfiguration übersprungen, vollständige Ausführung in CI vorgesehen.
- Produktionsbuild bestanden.
- Fünf bestehende Browserabläufe für Landingpage und Vorlagengalerie bestanden.
- 21 öffentliche Seiten jeweils bei 1440 und 390 Pixeln geprüft: keine alten
  Datenschutzgarantien, veralteten Impressumsverweise oder Seitenüberläufe;
  keine Browserfehler. Sichtprüfung der Screenshots und des neuen Posters.
- Ein bestehender Zufallsfehler in `server/crypto.test.ts` wurde durch CI
  sichtbar: Das Ersetzen eines zufälligen Bytes durch `00` änderte bei bereits
  vorhandenem Nullbyte nichts. Der Manipulationstest kippt nun garantiert ein
  Bit; die produktive Verschlüsselung bleibt unverändert.
- Finale CI und Auslieferung: Ergebnis wird ergänzt.

Private Betriebsnachweise, Inventur und Screenshots:
`~/TrichterwerkBackups/reviews/public-claims-2026-11-02/`.
