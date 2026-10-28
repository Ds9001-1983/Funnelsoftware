# R11: Statistik-Aufbewahrung und endgültige Funnel-Löschung

Stand: 28. Oktober 2026. **Lokal umgesetzt und geprüft, noch nicht veröffentlicht.**
Arbeitsverzeichnis: `../Funnelsoftware-analytics-retention`, Branch
`feat/analytics-retention`, Grundlage Produktionscommit `b5575c4`.

## Umsetzung

- Statistik-Aufbewahrung pro Funnel: frei gewählte Tagesfrist und Begründung,
  aggregierte Vorschau, gesonderte Aktivierung, Versionsprüfung und Pausieren.
  Keine vorgegebene Frist und keine automatische Aktivierung vorhandener Daten.
- Endgültige Bereinigung bereits gelöschter Funnels: kontoweite eigene
  Wartefrist, paginierte Vorschau und ausdrückliche Aktivierung. Jeder vorhandene
  Lead/Bewerber und jede Domainzuordnung blockiert die Beauftragung. Aktive und
  nur archivierte Funnels bleiben erhalten. Kontomedien und Vorlagen bleiben
  erhalten, da sie unabhängig bzw. gemeinsam verwendet werden können.
- Neue Journaltypen `analytics_before` und `queued_funnels` sind in Anwendung,
  Offline-Replay und eigenständigem Mac-Parser implementiert. Physische Löschung
  wartet auf die genaue externe Bestätigung; Aufträge überleben SQL-Rollbacks.
- Pro Lauf maximal 500 Statistikereignisse bzw. drei Funnels löschen. Neue
  Statistikbereiche werden höchstens einmal pro Funnel und UTC-Tag beauftragt,
  damit kontinuierlicher Traffic nicht jede Minute einen Journaleintrag erzeugt.
- Nach verbindlicher Beauftragung ist keine Funnel-Wiederherstellung möglich.
  Auch bereits wartende öffentliche Lead-Anfragen prüfen den Funnel innerhalb
  ihrer Transaktion erneut. Sperrreihenfolge ist Konto vor Funnel.
- Offline-Replay gleicht Lead-/Kontolöschungen vor Funnel-Löschungen ab und
  bricht bei unerwarteten verbliebenen Leads ab. Danach pausiert es die beiden
  neuen Regelarten: Alte Backups reaktivieren keine frühere Freigabe.
- Der Standard neuer Statistikzeitstempel ist explizit UTC, unabhängig von der
  PostgreSQL-Zeitzone. Historische Zeitstempel werden nicht umgeschrieben.
- Gesamtaufrufe bleiben erhalten. Detaildiagramme und A/B-Auswertungen weisen
  auf die durch Aufbewahrung verkürzte Datenbasis hin.

## Prüfungen

- Beide TypeScript-Prüfungen, Produktionsbuild und `git diff --check` bestanden.
- 507 Unit-/Komponententests bestanden; Datenbanktests separat aktiviert.
- Gesamte Datenbank-/Migrationssuite: 148 Tests bestanden. Nach der Ergänzung
  der täglichen Begrenzung und einer zusätzlichen Parallelitätsprüfung besteht
  die neue gezielte Suite abschließend mit 18 Tests. Zusammen sind damit
  150 unterschiedliche Datenbank-/Migrationsprüfungen abgedeckt.
- Alle 54 Browserabläufe bestanden. Die vier öffentlichen Lead-/Lifecycle-
  Abläufe nach der abschließenden Kontosperrprüfung erneut bestanden.
- Neue Oberflächen auf Desktop und 390 Pixel Mobilbreite geprüft, ohne
  horizontales Überlaufen. CSRF, Kontotrennung, veraltete Vorschauen, geänderte
  Eingaben und fehlende externe Bestätigung werden geprüft.
- Echte pg_dump/pg_restore-Tests für Statistik- und Funnelaufträge, wiederholter
  Replay, SQL-Rollback, wiederverwendete IDs, Grenzen bis zur Mikrosekunde,
  Lead-/Domain-Schutz und unveränderte Kontomedien bestanden.

Die breite Datenbanksuite benötigte lokal eine ausdrücklich angelegte Test-DB
mit UTC und einem vom bestehenden Mailtest akzeptierten Namen. Der erste Lauf
mit Berliner DB-Zeitzone und einem anderen Testsuffix scheiterte an diesen
beiden bestehenden Testannahmen; der vollständige korrigierte Lauf ist grün.
Die neue Statistikmigration wird zusätzlich unter Berliner Zeitzone geprüft.

Alle Laufzeitprüfungen verwenden lokale synthetische Daten. Keine produktiven
Datenbankabfragen, Löschaufträge, Kundennachrichten, Stripe-Aktionen oder Änderungen
am installierten Sicherungsdienst wurden in diesem Arbeitspaket ausgeführt.

Private Prüfnachweise:
`~/TrichterwerkBackups/reviews/analytics-retention-2026-10-28/`.

## Verbleibend vor Veröffentlichung

1. Kompatiblen Mac-Journalparser installieren und seinen unveränderten Umgang
   mit bestehenden Journaleinträgen sowie aktuelle Sicherungsbestätigung prüfen.
2. Release mit den beiden additiven Migrationen veröffentlichen, anschließend
   Live-Inventur und Release-Sicherung vergleichen.
3. Keine Kundenregel eigenmächtig aktivieren. Fristen und Aktivierung bleiben
   beim jeweiligen Kontoinhaber.

Die ausführliche Betriebs- und Wiederherstellungsanleitung steht in
[deploy/ANALYTICS_AND_FUNNEL_RETENTION.md](deploy/ANALYTICS_AND_FUNNEL_RETENTION.md).
R11 ist damit technisch zur Veröffentlichung vorbereitet, nicht als produktiv
abgeschlossen markiert. Plattform-Analytics (R12), Verträge und übrige offene
Auditpunkte sind separate Arbeitspakete.
