# Builder-Weiterentwicklung

Auftrag: Die Kundenanfrage umsetzen und veröffentlichen sowie die zuvor
erarbeiteten Builder-Vorschläge aus der ursprünglichen Übergabe fertigstellen.
Der Nutzer hat die Fortsetzung am 28.09.2026 ausdrücklich bestätigt.

## Veröffentlicht

- Recruiting und Landingpage: [PR #172](https://github.com/Ds9001-1983/Funnelsoftware/pull/172),
  Produktion `1348cd61f571f339f8f6d0e9a2e619574de4a595`.
- Deployment 36426511339 erfolgreich; Live-Health mit Commit, nginx-Assets,
  aktualisierter Vergleich und Login-Grenzen nach Veröffentlichung geprüft.
- SMTP-Verbindung und Anmeldung geprüft, keine Testmail an echte Empfänger.
- Datenbank/Uploads lokal zusätzlich gesichert unter
  `~/TrichterwerkBackups/releases/20260928T131051-1348cd61f571/`;
  SHA-256 mit Serverkopie identisch. Neue Versandwarteschlange bei Abnahme leer.

- Kompatible Revisionsgrundlage: [PR #173](https://github.com/Ds9001-1983/Funnelsoftware/pull/173),
  Produktion `94b7b7d1706766691cca5102a732ef83740b2d4e`, Deployment 36429672059 erfolgreich.

## Laufender Abschnitt: Editor mit Entwurfsschutz

Die Servergrundlage unterstützt bereits beide Speicherprotokolle:

- Alte Funnels behalten ihr bisheriges Verhalten, solange sie ausschließlich
  mit dem bisherigen Editor bearbeitet werden. Auch diese Schreibvorgänge
  erzeugen nun eine unveränderliche Inhaltsrevision.
- Die nächste Editoroberfläche sendet `documentVersion`, `expectedVersion` und
  `mutationId`. Der erste solche Schreibvorgang schaltet `editorProtocol` dauerhaft
  ein. Ab dann werden alte Schreibzugriffe abgelehnt; ein Save verändert nur den
  Entwurf, `publish: true` veröffentlicht atomar den angegebenen Stand.
- Erst diese kompatible Servergrundlage ausrollen, danach die Oberfläche.
  Dadurch kann ein Code-Rollback der neuen Oberfläche weiter den korrekten
  Live-Stand lesen. Nicht auf einen Code zurückgehen, der Revisionen nicht kennt,
  nachdem moderne Entwürfe aktiviert wurden.
- Wiederherstellen erzeugt einen neuen Entwurf und pausiert dort zuvor laufende
  A/B-Tests. Leads, Antworten, Analysedaten, Eigentümer, Domains und private
  Integrationseinstellungen werden nicht zurückgesetzt.
- Tracking-IDs und private Integrationseinstellungen bleiben aktuelle
  Betriebseinstellungen; sie sind kein Bestandteil von Inhaltsrevisionen.
- Veröffentlichung, öffentliche API, eigene Domain und HTML-Metadaten verwenden
  denselben veröffentlichten Inhalt. Vorschau und Editor lesen den Entwurf.
- Eine DB-Sperre und ein Protokoll-Trigger schützen den Übergang bei der Migration;
  Lead-/View-Zähler, Downgrades und Soft-Delete bleiben möglich.

Die Migration ergänzt Felder und eine Tabelle; bestehende Seiten-/Element-IDs,
Inhalte, URLs und Nutzerdaten werden nicht umgeschrieben. Es gibt keine
automatische Löschung von Revisionen.

Geprüft: TypeScript und Produktions-Build, 373 erfolgreiche Tests, bestehende
13 E2E-Abläufe, sechs gezielte
DB-Tests für Revisionen, Migrationstest und zusätzlicher HTTP-E2E für
Entwurf/Live, Domain-Auflösung, Wiederholung nach verloren gegangener Antwort,
Wiederherstellung mit später eingegangenen Leads und alte Editor-Tabs.
Restore-Probe einer aktuellen Produktionskopie erfolgreich: Beide Migrationsläufe
ließen alle 22 bestehenden Tabellen in ihren bisherigen Spalten unverändert.

## Noch zu erledigen

1. Servergrundlage mit Restore-Probe, CI und Live-Health abgeschlossen.
2. Editor umgesetzt, lokale Abnahme läuft: gemeinsame Schreibwarteschlange,
   ausdrückliche Veröffentlichung, paginierte Revisionsübersicht/Wiederherstellung,
   Konfliktanzeige mit Kopie/Download, nutzerbezogene lokale Inhaltssicherung ohne
   Integrationsgeheimnisse. Navigation wartet auf das Speichern, Vorschau öffnet
   den Entwurf. Änderungen während des Speicherns bleiben ungespeichert markiert.
   Neue Queue-/Hook-Tests und vollständiger UI-Test einschließlich Konfliktkopie
   bestanden. Gesamtabnahme: 378 Tests, 15 E2E-Abläufe, TypeScript und Build grün.
   Noch CI und Veröffentlichung abschließen.
3. Gemeinsamer versionierter Dokumentzugriff und ID-/Referenzhelfer.
4. Abschnitte/Layouts und gemeinsamer responsiver Renderer, bestehende Formulare
   und Antworten erhalten. Bearbeitung bleibt Desktop/Laptop.
5. Wiederverwendbare Designvorgaben/Markenstile.
6. Erweiterte Besucherregeln mit UND/ODER, Prioritäten, Standardziel und Testmodus.
7. Personalisierung aus Antworten und erlaubten Kampagnenparametern mit Ersatztext.
8. Eigene Vorlagen und Mediathek mit Eigentümergrenzen, stabilen URLs und
   Archivierung. Bestehende unzugeordnete Uploads weder umdeuten noch löschen.

Die Detailgrundlage bleibt die unveränderte Übergabedatei im ursprünglichen
Arbeitsverzeichnis `Funnelsoftware/UEBERGABE-PRODUKTENTWICKLUNG.md`.
