# R09 – Quellen für Wettbewerbervergleiche

Prüfung: 9. November 2026. Basis: Main `58c5dcb`; Arbeitsbranch
`fix/comparison-evidence`. Redaktionelle Überarbeitung der acht Vergleichsseiten,
der Startseiten-Tabelle und der Preiszusammenfassung unter `/funnel-builder`.

## Ergebnis

Die Tabellen enthalten ausgewählte, belegte Angaben mit konkreten Tarifgrenzen.
Ungeprüfte Nein-Kreuze, pauschale Überlegenheitsbehauptungen, erfundene
Einrichtungszeiten und veraltete Preisstaffeln sind entfernt. Die betroffenen
Startseiten-/Pillar-Texte enthalten auch keine unbelegten Mobilanteile oder
pauschalen Agenturkosten mehr. Dieser Schritt ist kein vollständiger Audit
aller Werbeaussagen auf Branchen-, Vorlagen- und sonstigen Seiten.

Prüfdaten sind feste Werte in [comparison-evidence.ts](shared/comparison-evidence.ts),
keine Ableitung aus der Besucheruhr. Dort liegen auch die Quellenlinks; die
Startseite importiert weiterhin nicht das umfangreiche SEO-Content-Modul.
Die Detailtexte stammen aus [seo-content.ts](shared/seo-content.ts).
Quellen, Datum und Tarifqualifizierungen erscheinen sowohl in der React-Ansicht
als auch im HTML für Crawler. Die Quellenprüfung ist kein Produkttest oder
Nachweis rechtlicher Konformität der Anbieter.

## Quellen und Abgrenzungen

Alle folgenden offiziellen Seiten wurden am 09.11.2026 abgerufen:

| Anbieter | Quelle | Redaktionelle Entscheidung |
| --- | --- | --- |
| Typeform | [Tarife](https://www.typeform.com/pricing) | Monatszahlung, USD und Basic-Kontingent ausdrücklich benannt. Keine pauschale Behauptung fehlender Logik, Analytics oder Landingpages. |
| Perspective | [Preise](https://www.perspective.co/pricing), [Tarif-Funktionen](https://intercom.help/perspective-funnels/en/articles/15191355-which-features-are-included-in-the-plans) | Netto-/Brutto-Unterschied und Jahresbindung sichtbar. A/B-Tests auf der ersten Seite; Add-on-Option berücksichtigt. Kundenboards nicht mit vollständigen Workspaces gleichgesetzt. |
| ClickFunnels | [Tarife](https://www.clickfunnels.com/pricing) | Regulären monatlichen Launch-Preis ausgewählt; zeitlich begrenzte Funnel-Aktionen nicht als dauerhafter Umfang übernommen. |
| FunnelCockpit | [Tarife](https://funnelcockpit.com/pricing/) | Projekte von Seiten unterschieden. Steuerstatus im ausgewerteten Material nicht eindeutig; im Vergleich ausdrücklich offen, keine Brutto-/Netto-Ersparnis berechnet. |
| Heyflow | [Tarife](https://heyflow.com/pricing/) | Belegte Starter-Kontingente und ausgewählte Funktionen; kein Zahlenpreis, solange Bereich und Abrechnungszustand nicht eindeutig zugeordnet sind. |
| MEETOVO | [Tarife](https://meetovo.de/preise/) | Kampagnen- und Aufrufkontingent sowie Netto- und Jahreszahlungsbedingungen berücksichtigt. |
| systeme.io | [Tarife](https://systeme.io/pricing) | Der Abruf enthält bei vielen dynamischen Preis-/Limitfeldern `null`. Keine Zahlen daraus oder aus Drittanbieterartikeln ergänzt; Tarifauswahl direkt verlinkt. |
| Onepage | [Tarife](https://onepage.io/de/pricing) | Mehrere Laufzeiten und gleichzeitig sichtbare Beträge nicht zu einem vermeintlichen Monatspreis vermischt. Funktionen, Nettopreise und Vorauszahlung erklärt. |
| Webflow | [Tarife](https://webflow.com/pricing) | Website-Tarif mit Jahreszahlung, USD und Steuern ausgewiesen; unbelegte Dauer-/Funktionsausschlüsse entfernt. |

Die Preisbeispiele sind keine funktionsgleichen Warenkörbe und keine
Ersparnisberechnung. Wo die Quelle den Steuerstatus nicht eindeutig belegt,
steht das beim Preis. Die Trichterwerk-Angaben beziehen sich auf den aktuellen
Produktstand mit Free und Pro; zusätzliche B2B-Vertragsänderungen in PR #183
werden dadurch nicht als veröffentlicht dargestellt.

## Pflege

Bei einer Aktualisierung zuerst die konkreten Quellen und Tarifbedingungen
prüfen, dann Text und Prüfdatum gemeinsam ändern. Ein neues Deployment allein
rechtfertigt kein neues Datum. Nicht eindeutig belegte Werte weglassen bzw.
den Auswahlbedarf erklären; fehlende Belege sind kein Nachweis einer fehlenden
Funktion. Für andere Währungen keine ungeprüften Umrechnungen ergänzen.

## Validierung und Freigabestand

- Beide TypeScript-Prüfungen und Produktionsbuild erfolgreich.
- 537 Tests ohne Datenbank erfolgreich; die 160 Datenbanktests sind in diesem
  lokalen Lauf ausdrücklich übersprungen, da keine Datenbank eingerichtet wurde.
- Bestehender SEO-Regressionstest um Quellen, Prüfdatum und Preisqualifizierungen
  im Crawler-HTML erweitert.
- 22 Browserbesuche: elf öffentliche Routen bei 1440 und 390 Pixeln, keine
  JavaScript-Seitenfehler oder überbreiten Dokumente; Quellenlinks und FAQ
  funktionieren. Die Browseruhr stand auf April 2031, das Prüfdatum blieb
  09.11.2026. APIs waren lokal simuliert, kein Backend-/Datenbanktest.
- Dabei gefundenen horizontalen Überlauf der Vergleichsübersicht durch
  umbrechende Link-Schaltflächen behoben. Startseiten- und Perspective-Tabelle
  zusätzlich visuell geprüft. Tabellen sind mobil innerhalb ihres Containers
  horizontal scrollbar.
- GitHub-CI wird im PR und im lokalen Gesamtprüfplan mit ihrem tatsächlichen
  Abschlussstand dokumentiert. Private Browsernachweise liegen unter
  `~/TrichterwerkBackups/reviews/comparisons-2026-11-09/`.

Kein Deployment, keine Änderung an Verträgen, Datenbank oder Anbieteraccounts.
R07-Anbieteranlagen und R16-Betreiberbelege bleiben eigenständige offene Punkte.

## Nachprüfung am 10. November 2026

PR #200 ist offen, als Entwurf markiert und konfliktfrei. Der bestehende
PR-CI-Lauf für `e0911a9` ist erfolgreich; es liegen keine GitHub-Reviews vor.

Zwei verbliebene Tarifwidersprüche sind korrigiert: Der Hinweis unter dem
Registrierungsbutton der acht Vergleichsseiten nennt jetzt die Pro-Testphase
ohne Kreditkarte und die anschließende Wahl zwischen Free und Pro. Die bisherige
Formulierung zur ersten Belastung suggerierte eine automatische Buchung.
Die gemeinsame Meta-Beschreibung von `/funnel-builder` nennt jetzt ebenfalls
Free und Pro einschließlich Mehrwertsteuer statt eines pauschalen Einstiegspreises
von 49 Euro. Sie wird im Client sowie in den serverseitigen Metadaten verwendet.

Die 17 bestehenden SEO-Registry-/Routingtests bestehen, `git diff --check` ist
fehlerfrei. Keine Änderung an Wettbewerberpreisen oder deren Prüfdatum; keine
erneute Quellenprüfung. Die bisherigen umfangreichen Testnachweise beziehen
sich auf den vorherigen Commit. Kein Merge oder Deployment.

## Ergänzung am 10. November 2026: Preisübersicht für Perspective

Eigener Branch `feat/perspective-preisuebersicht`, aufgesetzt auf
`fix/comparison-evidence`. Die Perspective-Seite bekommt als einzige
Vergleichsseite eine Tarifübersicht und fünf Preisfragen in den FAQ. Anlass:
Suchanfragen nach den Preisen von Perspective landen auf dieser Seite.

Beide Perspective-Quellen wurden am 10.11.2026 um 09:54 Uhr MEZ neu abgerufen
und alle Perspective-Angaben im Repo dagegen geprüft, auch die Tabellenzeilen
und die Startseiten-Tabelle. Das Prüfdatum für Perspective steht deshalb auf
dem 10.11.2026, die übrigen Anbieter bleiben beim 09.11.2026.

| Angabe | Wert laut Quelle | Quelle |
| --- | --- | --- |
| Base, Grow, Expand je Monat | 59 / 184 / 369 € monatlich, 47 / 147 / 297 € bei jährlicher Abrechnung, netto | Preisseite, Hilfeartikel |
| Live-Funnels, Leads, Nutzer | 2 / 100 / 1, 10 / 500 / 3, 20 / 1.000 / 5 | Preisseite, Hilfeartikel |
| Zusätzliche Leads | 0,25 € je Lead, keine Sperre | Preisseite (FAQ) |
| Add-on-Suite | 84 € monatlich, 67 € bei jährlicher Abrechnung | Preisseite |
| Branding entfernen, A/B-Tests | ab Grow, in Base über Add-on-Suite | Preisseite, Hilfeartikel |
| Testphase | 14 Tage, danach startet der gewählte Tarif automatisch | Preisseite (FAQ) |

Redaktionelle Entscheidungen:

- Scale: Die Preisseite zeigt 969 € pro Monat, der Hilfeartikel nennt einen
  individuellen Preis mit jährlicher Abrechnung. Die Tabelle schreibt
  „individuell“, der Hinweis darunter nennt beide Angaben. Leads und Nutzer
  stehen für Scale ebenfalls auf „individuell“, weil die Vergleichstabelle der
  Preisseite dort „Custom“ ausweist.
- Für Perspective wird kein Bruttopreis berechnet. Für Trichterwerk steht
  neben 49 € inklusive Mehrwertsteuer der Nettobetrag von 41,18 € bei 19 %,
  damit Netto mit Netto vergleichbar ist.
- Keine Aussage „günstiger“ und keine Ersparnisrechnung. Die Antwort auf die
  Frage nach einer günstigeren Alternative nennt den eigenen Preis und den
  Hinweis, dass die Tarife nicht funktionsgleich sind.
- Der Abschluss-CTA der Vergleichsseiten nannte noch eine „erste Belastung
  erst nach der Testphase“. Er nennt jetzt die Testphase ohne Kreditkarte.
  Dieselbe Formulierung steht weiter in `audience-funnel.tsx` (zweimal) und
  `funnel-builder.tsx` und ist nicht Teil dieses Schritts.

Tabelle, Hinweise und der eigene Tarif stehen in der React-Ansicht und im
Crawler-HTML aus derselben Quelle (`priceOverview` in `shared/seo-content.ts`).
Ab 768 Pixel Breite erscheint eine Tabelle, darunter je Tarif eine Karte.
Rohkopien der Quellen mit Abrufzeit und Prüfsummen sowie Bildschirmfotos der
drei Breiten liegen privat unter
`~/TrichterwerkBackups/reviews/comparisons-2026-11-10-perspective/`.
