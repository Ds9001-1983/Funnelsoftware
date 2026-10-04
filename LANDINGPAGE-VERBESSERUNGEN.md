# Landingpage: kostenlos starten

Basis: `ed95ee2` mit den sechs bereits geprüften Produktverbesserungen.
Arbeitsbranch: `feat/landing-free-100-leads`. Änderungen werden in sechs
inhaltlichen Schritten geprüft, committed und gepusht.

Das vorhandene kostenlose Angebot gilt dauerhaft für einen veröffentlichten
Funnel und 100 Leads **pro Monat**. Die im Backend zusätzliche Pro-Testphase
bleibt bestehen; die neue Landingpage bewirbt den dauerhaften Free-Plan.
Keine Änderung von Abrechnung, bestehenden Abos oder Tarifrechten.

1. Mobiler Header: kompakte Navigation, erreichbare Anmeldung, ein Start-Link.
2. Einstieg: konkreter Nutzen, echtes Editorbild, konsistenter Free-Start.
3. Demo: direkt nach dem Einstieg; Vorlagen führen zum jeweiligen Beispiel.
4. Aufbau: drei Kernvorteile, klare Free-/Pro-Preise, gekürzte FAQ.
5. Vertrauen: gekennzeichnetes Produktbeispiel; keine erfundenen Referenzen.
6. Messung: Demo-Nutzung und erste Veröffentlichung nachvollziehbar auswerten.

## Prüfungen

1. Header: Typecheck und fünf Browserprüfungen bestanden. Bei 320/390/768 px
   keine Überschneidungen, Navigation per Tastatur und Preis-Anker geprüft.

2. Einstieg: Typecheck und sieben Browserabläufe bestanden, einschließlich
   Registrierung bis Veröffentlichung. Desktop-/Handyansicht visuell geprüft.
   Das echte Editorbild lässt sich mit `scripts/capture-landing-editor.ts` auf
   einer isolierten lokalen E2E-Instanz neu aufnehmen.

3. Demos: Typecheck und alle zehn geprüften Landing-/Galerie-Browserabläufe
   bestanden. Jede Karte öffnet das passende Beispiel; die Vorlagenauswahl
   wird bis zur Anmeldung mitgegeben.

4. Aufbau/Preise: Typecheck und acht Browserabläufe bestanden. Drei Kernvorteile,
   Free/Pro und sechs FAQ ersetzen die lange Funktions-/Vergleichsfolge.
   Die Preisübersicht und strukturierten Angebotsdaten nennen Free und Pro;
   keine automatische Kostenpflicht nach 100 Leads, keine Agency-Zusagen.

5. Vertrauen: gekennzeichnete Illustration mit fiktiven Bewerbungsantworten und
   direktem Teamkontakt ergänzt. Unbelegte Prozent-/Zeitversprechen sowie die
   pauschale Vergleichstabelle mit automatisch aktuellem Datum entfallen.
   Typecheck und acht Landing-Browserabläufe bestanden.

6. Messung: Demo-Aufruf und erster Seitenwechsel werden ohne Eingabewerte
   gezählt. Die Betreiberübersicht zeigt je Vorlage die Nutzung und für neue
   Registrierungen den Anteil mit einer ersten erfolgreichen Veröffentlichung.
   Registrierung und Messbeginn werden gemeinsam gespeichert; Entwurf,
   fehlgeschlagene Veröffentlichung und erneutes Veröffentlichen zählen nicht
   zusätzlich. Gleichzeitige Veröffentlichungen zählen einmal je Konto.
   Bestandskonten werden nicht nachträglich zugeordnet. Admin- und gelöschte
   Konten sind ausgenommen; die endgültige Kontolöschung entfernt den Datensatz.
   Demo-Besuchstage und Konten werden nicht miteinander verknüpft. Unabhängige
   Ereigniszahlen werden deshalb nicht als durchgehender Besucherweg oder
   vermeintliche Absprungrate dargestellt.

## Gesamtprüfung und Betrieb

- 466 Unit-Tests, 77 Datenbank-/Migrationstests und 51 Browserfälle geprüft.
  Der bestehende Editor-Drag-and-drop-Fall wurde zusätzlich isoliert geprüft.
- Typecheck für Anwendung/Client-Tests und Produktionsbuild bestanden.
- Desktop- und Mobilansicht visuell geprüft; bei 320, 390 und 1440 px keine
  horizontale Überbreite und keine fehlenden Bilder. Die mobile Navigation ist
  zusätzlich bei 768 px, per Tastatur und mit Preis-Anker geprüft.
- Die neue additive Migration `20261004_signup_activations.sql` muss vor dem
  Start des neuen Backends laufen. Das vorhandene Deploy-Skript erledigt dies;
  wiederholte Migration und Erhalt bestehender Daten wurden geprüft.
- Die Messung liefert ab Veröffentlichung eine Grundlage für die weitere
  Optimierung. Eine Steigerung der Conversion wird ohne echte Nutzungsdaten
  und einen geeigneten Vergleich nicht behauptet.

Alle sechs Schritte liegen auf dem Feature-Branch. Ein Push ist noch keine
Veröffentlichung auf der produktiven Website.
