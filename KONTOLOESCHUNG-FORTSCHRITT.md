# Kontolöschung und zugeordnete Dateien (R10)

Stand: 15. Oktober 2026.

## Arbeitsstand

Die Implementierung auf `fix/account-file-deletion` ist für die Prüfung als
Pull Request fertiggestellt. Basis: `d1abe2789ef274063d30e5ea43380d32699103ca`.
Die Anwendung ist noch nicht veröffentlicht. Produktionsdatenbank und echte
Konten wurden nicht verändert; ausschließlich die ausdrücklich bestätigte
Altdatei-Zuordnung wurde als geschützte Betreiberfreigabe auf dem Server hinterlegt.

Arbeitsverzeichnis: `../Funnelsoftware-deletion`. Das separate B2B-/Vertragspaket
liegt in `../Funnelsoftware-b2b` und ist hier nicht enthalten.

## Verhalten

- Bild-, Audio- und private Support-Uploads bekommen vor dem Schreiben eine
  dauerhafte Eigentümerzuordnung in `owned_uploads`. Auch nach einem
  fehlgeschlagenen Upload bleiben vorhandene Dateireste einem Konto zugeordnet.
- Selbstlöschung und Admin-Löschung verwenden denselben Ablauf: Konto sperren,
  gespeicherte Pfade prüfen, zugeordnete Dateien entfernen, Sitzungen und Konto
  anschließend in einer Datenbanktransaktion löschen. Laufende Uploads desselben
  Kontos werden über Datenbanksperren mit der Löschung koordiniert.
- Bei einem Dateifehler bleiben Konto und Zuordnungen für einen erneuten
  Versuch bestehen. Bereits entfernte Dateien werden dabei nicht wiederhergestellt;
  fehlende Dateien sind beim nächsten Versuch zulässig. Fremde Uploads werden
  nicht anhand bloßer Verweise in einem Funnel dem Konto zugeschlagen.
- Die additive Migration übernimmt belegte Zuordnungen aus Mediathek und
  Fehlermeldungen. Frühere Bild-/Audio-Dateien ohne solche Nachweise werden
  nicht automatisch einem Nutzer zugewiesen oder gelöscht.
- Die Support-Bereinigung behält fehlgeschlagene Pfade für einen späteren Lauf.
  Abgelaufene Meldungen werden erst nach Entfernung ihrer Dateiverweise gelöscht.
- Express liefert Uploads mit `Cache-Control: no-store`; entfernte URLs ergeben
  404 statt der Anwendung. Die entsprechende nginx-Konfiguration ist vorbereitet.
- Die Oberfläche beschreibt Konto, Funnels, Leads und zugeordnete Uploads;
  Backups, Abrechnungsunterlagen und versandte E-Mails haben getrennte Abläufe.

## Lokale Prüfung vom 15. Oktober

- `git diff --check`, `npm run check:all` und Produktionsbuild bestanden.
- 424 Unit-/Komponententests bestanden.
- Alle 76 Datenbank-/Integrationstests bestanden, einschließlich acht Tests
  zur Dateilöschung und drei Migrationstests. Die Migration wurde wiederholt
  ausgeführt; bestehende Funnel-Inhalte, IDs, Lead-Antworten und Status blieben
  in den synthetischen Migrationsfällen erhalten.
- Der neue Browserablauf bei 390 Pixel Breite bestand: Bild, Audio, Screenshot
  und Anhang hochladen, falsches Passwort ablehnen, Konto über die Oberfläche
  löschen, Dateien/Sitzungen prüfen, fremden Upload erhalten und anschließend
  den Admin-Löschpfad testen.
- Auch die übrigen 47 Browserabläufe bestanden mit allen Builder-Funktionen
  aktiviert. Insgesamt: **500 Unit-/Integrationstests und 48 Browserabläufe**.

Die Tests nutzten ausschließlich synthetische Konten und Dateien sowie einen
eigens angelegten PostgreSQL-Prozess auf `127.0.0.1:55438`, Datenbank
`funnelsoftware_e2e`, HTTP-Testserver auf Port 5140. SMTP, Stripe und
Hintergrundversand waren im Testserver deaktiviert. Die 76 Tests, die im
Unit-Lauf ohne Datenbank übersprungen werden, wurden separat vollständig ausgeführt.

Integrations- und Browserprotokoll sowie Quellstand und Prüfsummen sind unter
`~/TrichterwerkBackups/reviews/account-deletion-2026-10-15-local/` archiviert.
Der separate mobile Löschablauf, Typprüfung, Unit-Lauf und Build sind durch die
Ausgaben dieser Sitzung belegt; dafür wird kein vollständiges Rohprotokoll behauptet.

## Ergänzungen nach der lokalen Abnahme

Der Betreiber hat die Zuordnung der einzigen bisher unzugeordneten Altdatei
zu seinem Konto ausdrücklich bestätigt. `upload-ownership-approvals.json` liegt
mit Modus 0600 auf dem Produktionsserver, außerhalb der Versionsverwaltung.
Die Freigabe enthält Kontoidentität, Dateiname und SHA-256. Erst das Deployment
übernimmt sie nach der Migration in `owned_uploads`; es entfernt keine Datei.
Die damalige lesende Inventur fand eine öffentliche Datei und keine
Mediathek-/Support-Datensätze. Die Freigabe ersetzt keine erneute Inventur.

`scripts/apply-upload-ownership.mjs` prüft neue Zuordnungen gegen Kontoidentität
und Dateiinhalt. Traversierung, Symlinks, veränderte Bilder und widersprechende
Eigentümer werden abgewiesen. Ein fehlerhafter Eintrag rollt den ganzen
Übernahmevorgang zurück. Erneute Deployments bleiben auch nach Kontolöschung
oder späterem Umbenennen des bereits zugeordneten Kontos möglich.

`scripts/activate-release.sh` beendet den alten PM2-Prozess vor der finalen
Inventur. Dadurch kann er nach dieser Prüfung keine unzugeordneten Uploads
mehr schreiben. Anschließend wird ausschließlich die bekannte nginx-Regel
für `/uploads/` angepasst, mit `nginx -t` geprüft und geladen. Unbekannte
Konfigurationen werden abgewiesen; andere lokale Einstellungen bleiben erhalten.
Erst danach folgen Release-Umschaltung und Health-Prüfung. Fehler stellen den
vorherigen Code und die gesicherte nginx-Konfiguration wieder her und starten
die alte Anwendung. Datenbanken und neue Leads werden dabei nicht zurückgesetzt.
Während dieser Umschaltung ist die Anwendung kurz nicht erreichbar.

Vier zusätzliche Datenbanktests und zehn Konfigurations-/Release-Tests bestanden.
Die sechs Release-Szenarien ändern echte temporäre Konfigurationsdateien und
Symlinks; PM2, nginx, Netzwerk und Inventur sind dabei gezielt ersetzte
Testkommandos. Geprüft wurden Erfolg sowie Inventur-, Syntax-, Reload-,
Neustart- und Health-Fehler. Die Konfigurationsanpassung wurde außerdem lesend
gegen die tatsächlich installierte nginx-Datei vorbereitet; keine aktive
Konfiguration wurde in dieser Vorprüfung geändert. Die ersten 500 Tests plus
14 Ergänzungen ergeben 514 Tests; die vollständige CI folgt am Pull Request.

## Veröffentlichung und Abnahme

1. Aktuellen Zielbranch abgleichen. Bei Zusammenführung mit PR #183 besonders
   Registrierungsfixtures, Testprojekte, `package.json`, CI, Schema und
   Migrationsanzahl abstimmen; beide Pakete enthalten eigene Browser-Testläufe.
2. Die vorbereitete Betreiberfreigabe wird beim Deployment zusammen mit
   Datenbank, Uploads und Umgebung gesichert. Backup/Restore und wiederholte
   additive Migration laufen vor der Produktionsmigration.
3. Nach Migration und Übernahme der geprüften Freigabe erfolgt die erste
   Inventur. Offene Altdateien blockieren die Umschaltung. Nach Ende des alten
   Prozesses folgt eine zweite Inventur; ein Fehler startet den alten Stand.
4. nginx-Konfiguration und Release werden automatisch mit Wiederanlauf bei
   Fehlern umgeschaltet. Anschließend Release-SHA, Upload-Eigentümerzuordnung,
   `Cache-Control: no-store`, 404-Verhalten sowie Backup-Prüfsummen kontrollieren.
   Frühere Browser-/Drittkopien sind nicht rückwirkend entfernbar.
5. Den Prüfnachweis und Produktionsstand nach erfolgreichem Deployment ergänzen.
   Kein echtes Kundenkonto als Abnahmetest löschen.

R10 ist damit zur Veröffentlichung vorbereitet, noch nicht als produktiv
erledigt abgenommen. R11 (vollständiger Export, Aufbewahrung, Backups und Prozesse für
bereits versandte Daten) bleibt ein eigenständiges offenes Paket.
