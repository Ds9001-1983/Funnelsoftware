# R12 – Datenschutz der eigenen Plattform-Statistik

Stand: 31. Oktober 2026. **Lokal umgesetzt und geprüft; nicht veröffentlicht.**
Arbeitsverzeichnis: `../Funnelsoftware-platform-privacy`, Branch
`fix/platform-analytics-privacy`, Grundlage `5bf29de` (einschließlich PR #197).

## Ergebnis

- Zufälliger, flüchtiger HMAC-Schlüssel pro Prozess/UTC-Tag statt Ableitung aus
  SESSION_SECRET. Neue Kennung bei Neustart; keine Zusage vollständiger Anonymität.
- Sofortiger Widerspruch in `/datenschutz`, hostgebundene Präferenz für maximal
  ein Jahr; serverseitige Beachtung auch bei Registrierung, DNT und GPC.
  Bei blockierten Cookies gilt die Wahl im Tab; der Registrierungsrequest trägt
  sie zusätzlich als Header. Marketing-Einwilligungen bleiben separat.
- Neue Ereignisse übernehmen keine freien Referrer-/UTM-Werte. Aktionslabels
  sind auf Produktcodes begrenzt. Damit entfällt die Quellen-/Kampagnenzuordnung
  neuer Ereignisse; alte Einträge bleiben bis zur bestätigten Bereinigung erhalten.
- Zahlungs-/Abo-Ereignisse enthalten keine abgeleitete Kontokennung mehr und
  erscheinen als separate Ereigniszähler außerhalb der Besucherfolge im Admin.
- Konfigurierbare Aufbewahrung ohne Standardaktivierung, lesende Vorschau,
  höchstens ein Journalbereich pro UTC-Tag und 500 Löschungen je Minutenlauf.
- Neuer Typ `platform_before` in Anwendung, Offline-Replay und Mac-Parser.
  Löschung wartet auf die externe Bestätigung des konkreten Auftrags.
  Bereits geschriebene Aufträge bleiben bei SQL-Rollback und Deaktivierung erhalten.
- Additive Migration verändert nur den UTC-Standard neuer Statistikzeitstempel.
  Kunden-Funnels, Leads, Kundenstatistiken und Medien bleiben außerhalb des Pakets.
- Betriebsanleitung und Entwurf einer Interessenabwägung liegen in
  [deploy/PLATFORM_ANALYTICS_PRIVACY.md](deploy/PLATFORM_ANALYTICS_PRIVACY.md).

## Prüfung

- Beide TypeScript-Prüfungen und Produktionsbuild bestanden.
- 537 Unit-/Komponenten-/Skripttests bestanden. Die standardmäßig deaktivierten
  Datenbanksuiten sind damit nicht pauschal mitgeprüft.
- 54 gezielt aktivierte Datenbanktests bestanden: neues Paket (5), bestehendes
  Löschjournal (31) und bisherige Analytics-/Funnel-Aufbewahrung (18).
- Vier Migrationsprüfungen bestanden, einschließlich UTC-Standard unter Berliner
  Datenbankzeitzone und zweimaliger Migration ohne Änderung bestehender Inhalte.
- 13 Browserabläufe bestanden: fünf neue R12-Abläufe sowie acht bestehende
  Consent-Abläufe. Mobilbreite 390 Pixel; Widerspruch, Reload, Registrierung,
  blockierte Cookies, DNT/GPC, Hostgrenzen und verworfene freie Metadaten geprüft.
- Echte pg_dump/pg_restore-Kette mit wiederholtem Replay und SQL-Rollback;
  exakte Stichtagsgrenze bis zur Mikrosekunde, höhere IDs, Batches, Parallelität,
  fehlende/exakte externe Bestätigung und unveränderte Kundenstatistik geprüft.
- Ein erster Browserlauf scheiterte an Vites Zugriff auf über einen Symlink
  eingebundene Schriftdateien. Eigene lokale Abhängigkeiten beheben dies;
  der vollständige anschließende Lauf ist grün. Ein erster Unit-Test musste
  seinen vom Vorgängertest gesetzten Host-Mock zurücksetzen.

Tests ausschließlich mit eigenen lokalen Wegwerf-Datenbanken und synthetischen
Daten. Keine Live-Abfragen, produktiven Löschaufträge, Kundenmails, Zahlungen,
Deployments oder Änderungen am installierten Mac-Dienst in dieser Fortsetzung.

## CI-Nachprüfung

Der erste vollständige CI-Browserlauf erreichte nach 51 bestandenen Abläufen
im letzten bisherigen Besucherregel-Test das echte Registrierungslimit (HTTP 429).
Die fünf neuen R12-Tests laufen deshalb nun wie die vorhandenen Sonderpakete in
einem eigenen Playwright-Projekt mit eigenem Serverstart. Die produktiven Limits
bleiben unverändert. Vollständige CI-Nachprüfung läuft erneut.

## Noch offen

Der Betreiber hat am 31.10.2026 **90 Tage** bestätigt. Die Aktivierung mit
`PLATFORM_ANALYTICS_RETENTION_DAYS=90` erfolgt nach produktiver Vorschau und
kompatiblem Update des Mac-Parsers. Bis dahin bleibt die Automatik ausgeschaltet.

Vor Veröffentlichung: kompatiblen Mac-Parser installieren und prüfen, Release
über den bestehenden Backup-/Restore-Prozess ausrollen, gewählte Frist rein
lesend inventarisieren und erst nach Betreiberentscheidung aktivieren. Danach
Live-Abnahme und Sicherungsnachweis ergänzen. Die Interessenabwägung braucht
noch fachliche Prüfung; R12 ist damit
noch nicht als vollständig abgeschlossen oder rechtlich freigegeben markiert.
