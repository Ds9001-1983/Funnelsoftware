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
