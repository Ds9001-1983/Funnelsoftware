# Löschjournal und Wiederherstellung

Dieser Ablauf deckt automatische Aufbewahrungsaufträge und die bestehenden
manuellen Löschwege ab: einzelner Lead,
Leads zur aktuellen E-Mail eines Kundenkontos sowie vollständige Kontolöschung
einschließlich ihrer Datenbankkaskaden, Sitzungen und zugeordneten Dateien.
Er aktiviert keine Aufbewahrungsfrist und entfernt keine alten Sicherungen.
Historische Mail-Empfänger ohne aktuell passenden Lead bleiben wie bisher ein
gesonderter Prüffall aus `SUBJECT_ACCESS.md`.

## Speicherung und Fehlerverhalten

Das Journal liegt in Produktion unter `/var/lib/funnelflow/erasure-journal`,
außerhalb von Checkout, Uploads und Datenbank. `ERASURE_JOURNAL_DIR` kann einen
anderen absoluten, nicht öffentlichen Pfad vorgeben. Verzeichnisrechte 0700,
Dateien 0600. Es enthält ausschließlich unveränderliche Kennungen, Dateinamen,
Zeitpunkte und eine fortlaufende Hashkette; keine Namen, Adressen, Antworten
oder Mailinhalte. Konten erhalten eine zufällige `erasure_key`, Leads verwenden
ihre bestehende UUID. Wiederverwendete numerische IDs werden nicht getroffen.

Jeder autorisierte Auftrag wird vor dem ersten Löschen vollständig geschrieben,
per fsync gesichert und ohne Überschreiben veröffentlicht. Erst danach werden
Dateien und Datenbankdaten entfernt. Eine Datenbankquittung wird gemeinsam mit
der Löschung committed. Auch bei einer fehlgeschlagenen Antwort bleibt ein
bereits geschriebenes Löschbegehren verbindlich: erneuter Versuch bzw. Replay
führt es zu Ende. Ein Fehler ist deshalb keine Rücknahme des Löschauftrags.
Ein alter unmittelbarer Lead-Auftrag (`leads`) oder Kontoauftrag (`account`)
mit noch vorhandenen Daten sperrt den nächsten Start. Wartende Lead-Aufträge
(`retention_leads`) aus manuellen Anfragen oder Aufbewahrungsregeln dürfen bis zur externen
Bestätigung warten; ihre Leads bleiben für Änderungen und automatische Mails
gesperrt. Die Datenbankquittung bindet dabei bereits den Auftrag und ist kein
Nachweis einer abgeschlossenen Löschung. Offline-Replay führt auch diese
verbindlichen Aufträge aus. Vor der Freigabe eines Restore immer Replay ausführen,
nicht nur den Startcheck.

Mehrere App-Prozesse derselben Datenbank koordinieren sich über eine
Transaktionssperre. Es darf nur eine produktiv schreibende Datenbank pro Journal
geben. Wiederhergestellte Kopien lesen das aktuelle Journal; sie schreiben
keine neuen Aufträge hinein. Das Journal und unabhängige aktuelle Checkpoints
müssen separat gesichert werden und dürfen nie gemeinsam mit einem alten
Anwendungsbackup zurückgesetzt werden. Bei unklarer Aktualität bleibt das
System geschlossen; ein altes Journalarchiv ist kein Aktualitätsnachweis.

## Erstaktivierung und Deployments

Die additive Migration legt Kennungen und Quittungstabellen an. Während der
Release-Umschaltung stoppt PM2 zuerst die alte Anwendung. `prepare-release`
initialisiert das Journal einmalig und erzeugt bei jedem Deploy eine zusätzliche
konsistente Sicherung mit Datenbank, Uploads und damaligem Checkpoint:

- `journal-baseline.dump`
- `journal-baseline-uploads.tar.gz`
- `journal-baseline-checkpoint.json`
- `journal-baseline-SHA256SUMS`

Die bisherige Sicherung vor der Migration bleibt erhalten. Vor der Umschaltung
werden die Journalbindung und alle Löschaufträge geprüft. Auch bei späteren
Starts geschieht dies vor Routen, Scheduler und Mailworker. nginx leitet
Upload-URLs durch die Anwendung, damit deren Startblockade auch direkte
Dateiabrufe sperrt. Kundendomains verwenden bereits denselben Proxyweg.

Sicherungen vor der erstmaligen Journalaktivierung besitzen weder die stabile
Kontokennung noch eine Journalbindung und sind für diesen automatischen Ablauf
gesperrt. Eine nachträgliche Migration ersetzt keinen fehlenden Löschverlauf.
Solche Sicherungen benötigen eine gesonderte manuelle Aufarbeitung in Isolation.
Die Initialisierung darf dafür nicht erneut ausgeführt werden.

## Kontrollierte Wiederherstellung

1. Anwendung und alle schreibenden Hintergrunddienste auf der Quellinstallation
   stoppen. Die öffentliche Umschaltung bleibt geschlossen. Das Journal am
   unabhängigen Speicherort unverändert lassen. Seine Vollständigkeit einschließlich
   der letzten bestätigten Löschungen prüfen. Bei Verlust der Quellinstallation
   oder unklarer Aktualität nicht mit einem geratenen Checkpoint fortfahren.
2. Einen aktuellen Checkpoint aus dieser Quelle erzeugen; vorhandene Dateien
   werden absichtlich nicht überschrieben:

   ```sh
   NODE_ENV=production node --import tsx scripts/erasure-journal.ts checkpoint /geschuetzter/pfad/current-erasure-head.json
   ```

3. Die geprüfte Sicherung in eine neue lokale Datenbank `tw_restore_<kennung>`
   einspielen und die zugehörigen Uploads in ein separates privates Verzeichnis
   außerhalb der laufenden Anwendung entpacken. Keine alten `.env`-Dateien,
   Journaldateien oder Uploads auf die öffentliche Installation zurückkopieren.
   Datenbank und Dateikopie während der gesamten Prüfung offline halten.
4. `DATABASE_URL` auf die isolierte Restore-Datenbank setzen, den unabhängigen
   Journalpfad beibehalten und den aktuellen Checkpoint separat bereitstellen:

   ```sh
   NODE_ENV=production node --import tsx scripts/erasure-journal.ts replay /geschuetzter/restore-root /geschuetzter/pfad/current-erasure-head.json
   NODE_ENV=production node --import tsx scripts/erasure-journal.ts check /geschuetzter/restore-root
   ```

   Replay verweigert andere Datenbanknamen, fremde Hosts, zusätzliche
   Datenbankverbindungen, einen fehlenden oder abweichenden Checkpoint sowie
   beschädigte oder unvollständige Journale. Es kann beliebig wiederholt werden.
   Dateien werden vor Datenbankkaskaden gelöscht; Dateifehler verhindern die
   Freigabe. Eine fortschreitende Quellinstallation macht den Checkpoint ungültig.
5. Upload-Eigentümerinventur im isolierten Dateiroot durchführen. Datenbank und
   Dateien müssen zusammenpassen. Nicht zugeordnete Dateien, Mailzustände und
   sonstige externe Systeme vor der Freigabe klären. Erst dann die zusammengehörige
   Datenbank und Dateikopie umschalten. Den aktuellen Programmstand verwenden,
   dessen Journalprüfung vor jedem Start läuft. Vor öffentlicher Freigabe die
   Health-Antwort und direkte URLs gelöschter Testdateien prüfen.

Ein aktueller Checkpoint wird nie aus dem gerade zurückgespielten Backup als
Freigabe übernommen. Alte Backups oder Journalteile werden von diesen Werkzeugen
nicht gelöscht. Eine Betreiberfrist für Backups, ein automatischer externer
Journal-Backupdienst mit lückenloser Replikation bleiben separate Arbeiten.
Kundengesteuerte Aufbewahrungsjobs sind in [RETENTION_AUTOMATION.md](RETENTION_AUTOMATION.md) beschrieben. Der zeitgesteuerte externe Mac-Abruf ist in
[ERASURE_BACKUP.md](ERASURE_BACKUP.md) beschrieben. Er prüft Kopien und Aktualität,
kann aber Offline-Zeiten des Macs nicht überbrücken und ersetzt keinen
abschließenden aktuellen Quellenvergleich.

## Automatisierte Abnahme

`server/erasure-journal.integration.test.ts` erstellt eine eigene lokale
Testdatenbank. Die Tests erzeugen ein echtes pg_dump-Backup, löschen synthetische
Daten, spielen es mit pg_restore zurück und führen Replay zweimal aus. Geprüft
werden unter anderem Kaskaden, Dateientfernung, Sessions, fremde Konten,
wiederverwendete IDs, unterbrochene Aufträge, Parallelität, beschädigte Journale,
veraltete Checkpoints und symbolische Verzeichnisse. Die Release-Tests prüfen
zusätzlich die Startreihenfolge und den Rücksprung bei fehlgeschlagener Prüfung.
