# Bewerberverwaltung und Kundenbereiche

Stand: 28.09.2026. Umsetzung zur Kundenanfrage; die weitergehenden Builder-Pakete
aus `UEBERGABE-PRODUKTENTWICKLUNG.md` sind ein anschließender Arbeitsabschnitt.
Diese Datei dokumentiert den Funktionsumfang und die geprüfte Auslieferung.

## Nutzung

- Unter **Leads → Bewerberprozess** einen Funnel auswählen. Das Board unterstützt
  Drag-and-drop, Statusauswahl, Kontaktinformationen und den Änderungs-/Mailverlauf.
- Unter **Board & E-Mails** (Pro bzw. aktive Testphase, bestätigte E-Mail) zwei bis
  20 Spalten mit Namen, Farben und Statistikzuordnung einrichten. Die erste
  Spalte nimmt neue Bewerbungen auf. Belegte Spalten und Spalten mit Mailregeln
  lassen sich nicht entfernen.
- Pro Funnel eine Eingangsbestätigung und je Zielspalte eine Status-Mailregel
  konfigurieren. Variablen: `{{name}}`, `{{company}}`, `{{funnel}}`. Neue Regeln
  sind zunächst deaktiviert. Eine Testmail geht ausschließlich an den Betreiber.
- Unter **Kundenbereiche** einen Bereich anlegen, eigene Funnels zuordnen und
  Kunden einladen. Annahme erfordert Anmeldung und bestätigte E-Mail-Adresse.
  Kunden können freigegebene Bewerbungen lesen und den Status ändern. Dafür
  benötigen sie kein eigenes Pro-Abo. Editor, Abrechnung, Mailregeln und andere
  Bereiche bleiben beim jeweiligen Betreiber. Ein Funnel gehört höchstens einem
  Bereich. Bestehende Teams erzeugen keine automatischen Freigaben.
- Zugänge lassen sich unmittelbar entziehen. Das Entfernen einer Freigabe oder
  eines Kundenbereichs löscht keine Funnels, Bewerbungen oder Antworten. Bei
  Wegfall des Betreiber-Pro-Plans pausiert der Kundenzugriff; Daten bleiben erhalten.

## Mailverhalten

Der Versand erfolgt mit der konfigurierten Trichterwerk-Absenderadresse und
dem frei wählbaren Anzeigenamen. Antworten gehen an die bestätigte Adresse des
Betreibers. Der Maildienst muss SMTP-Annahme bestätigen; **angenommen bedeutet
nicht nachweislich im Posteingang zugestellt**.

Statuswechsel und Versandaufträge werden atomar gespeichert. Gleichzeitige
Änderungen prüfen die erwartete Version; veraltete Änderungen erhalten 409.
Ein automatischer Auftrag entsteht höchstens einmal pro Bewerbung und Regel,
auch beim Zurückverschieben oder Bearbeiten derselben Regel. Aktivieren arbeitet
keine Bestandsbewerbungen nach. Abschalten verwirft wartende Aufträge; bereits
in Bearbeitung befindliche/versendete Nachrichten können nicht zurückgerufen werden.
Wartende Status-Mails werden beim Verlassen der Zielspalte verworfen.

Mehrere Worker beanspruchen Aufträge mittels `FOR UPDATE SKIP LOCKED`.
Eindeutig vor Annahme abgewiesene temporäre Fehler werden bis zu dreimal versucht.
Timeouts und abgelaufene Bearbeitungsfristen erhalten **Versand unklar** und
werden zur Vermeidung doppelter Nachrichten nicht automatisch wiederholt.
Vor Versand werden Berechtigungen, aktiver Betreiber, Plan, Regel und Zielstatus
erneut geprüft. Es gibt keinen Newsletter-Versand oder zeitgesteuerte Mailsequenzen.

## Prüfung und Migration

- 367 Unit-/Integrationstests einschließlich Datenbank, Worker und Migration.
- 13 Browser-/API-Tests einschließlich Kundenannahme ohne Pro, Bereichstrennung,
  Statuswechsel, Mailvormerkung, Entzug, mobil nutzbarer Oberfläche sowie der
  bestehenden Funnel-, A/B- und Tracking-Abläufe.
- TypeScript-Prüfungen und Produktionsbuild.
- Frisches Backup auf dem Produktionsserver isoliert wiederhergestellt; vor/nach
  zweimaliger Migration identische Inhalte aller 15 bisherigen Tabellen geprüft.
  Dabei wurde kein Produktprozess auf der Kopie gestartet und keine Mail versendet.
- PM2-Wechsel mit separatem PM2-Verzeichnis und harmlosen Testprozessen geprüft.

E2E-Tests benötigen ausdrücklich eine lokale `E2E_DATABASE_URL` mit DB-Namen
`funnelsoftware_e2e[_suffix]`. Der Runner startet einen eigenen Server ohne
übernommene Secrets oder `.env`; Scheduler, Mailworker, SMTP, Stripe und Sentry
sind deaktiviert. Direkte SQL-Tests benötigen zusätzlich die jeweils expliziten
`RECRUITING_TEST_DATABASE_URL`, `WORKSPACE_TEST_DATABASE_URL`,
`MIGRATION_TEST_DATABASE_URL` sowie `RECRUITING_MAIL_INTEGRATION=1` und die lokale
`DATABASE_URL`. SMTP-Tests verwenden einen Speichertransport.

Produktionsschema ausschließlich mit den versionierten SQL-Dateien unter
`migrations/` und `scripts/migrate.mjs` aktualisieren; kein `drizzle-kit push`
auf Produktion. Checksummen verhindern das nachträgliche Ändern angewendeter
Migrationen. Die erste Migration ergänzt sieben Tabellen sowie zwei Lead-Spalten.
Bestehende Inhalte, Eigentümer, URLs und Statuswerte werden nicht umgeschrieben.

## Veröffentlichung und Rückkehr zum vorherigen Code

GitHub Actions prüft den exakten Commit, bevor `scripts/deploy-production.sh`
aufgerufen wird. Das Skript baut einen separaten Release, sichert Datenbank,
Uploads, private Uploads und Konfiguration, stellt die DB in einen temporären
Bereich wieder her und prüft dort Migration und Datenbestand. Erst danach wird
das Produktivschema ergänzt.

Der stabile `dist`-Symlink verbindet die nginx-Dateien mit dem PM2-Einstieg.
Alte Hash-Assets bleiben für bereits offene Browser erhalten. Der Healthcheck
prüft DB-Zugriff und den veröffentlichten Commit. Bei Fehlern werden der vorige
Code und die vorigen Dateien aktiviert; das additive Schema bleibt bestehen.
**Keine Datenbank zurückspielen, um einen Code-Release zurückzunehmen:** Dadurch
könnten zwischenzeitlich eingegangene Bewerbungen verlorengehen.

Release-Backups liegen geschützt unter `/var/backups/funnelflow/releases/` mit
Commit, Prüfsummen und `previous-dist`. Eine automatische Bereinigung alter
Release-Verzeichnisse oder dieser Sicherungen wurde bewusst nicht eingeführt.

## Anschließende Builder-Arbeit

Noch ausstehend: getrennte Entwürfe/Live-Versionen und dauerhafte Revisionen,
atomarer Speicherkonfliktschutz, versionierte Dokumente, Layout-/Abschnittsvorlagen,
Markenstile, erweiterte Besucherregeln, Personalisierung sowie eigene Vorlagen
und Mediathek. Die ursprüngliche Übergabe bleibt die Detailgrundlage; die dort
früher festgehaltene reine Planungsphase wurde durch den Umsetzungsauftrag im
Gespräch abgelöst. Recruiting-Arbeit und sichere Migration liefern bereits
die isolierte Testumgebung und den geprüften Sicherungs-/Restore-Ablauf.
