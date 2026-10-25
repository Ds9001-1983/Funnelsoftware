# Sicherungsabruf und automatische Aufbewahrung

Betreiberentscheidung vom 25.10.2026: Server-Releases 30 Tage, Mac-Releases
90 Tage und tägliche Kopien auf Server und Mac jeweils 30 Tage. Ein Tag sind
24 Stunden. Schutzfälle haben Vorrang vor diesen Fristen.

## Ablauf

`scripts/backup-daily.sh` ersetzt den bisherigen Serverjob um 03:00 UTC.
Es sichert Datenbank, `uploads` und `private-uploads`, prüft die Archive und
stellt den SQL-Dump in einer eigenen `tw_restore_daily_*`-Datenbank wieder her.
Die wiederholte Migration muss alle bestehenden Tabelleninhalte unverändert
erhalten. Erst danach werden die beiden Dateien veröffentlicht und der
Restore-Nachweis geschrieben. Ein Fehler aktualisiert den Nachweis nicht.
Die temporäre Restore-Datenbank wird anschließend entfernt.

Der Mac-LaunchAgent `de.trichterwerk.backup-retention` läuft bei Anmeldung und
stündlich, solange der Mac angemeldet, eingeschaltet und verbunden ist. Er ruft
das neueste geprüfte Tagespaar und die aktuelle geprüfte Release-Sicherung über
SSH mit Hostschlüsselprüfung ab. Das Stundenintervall erlaubt Nachholen nach
Ruhezeiten. Unveränderte vorhandene Dateien werden nicht überschrieben.

Nach vollständigem SHA-256-Abgleich und dauerhaftem Schreiben der lokalen
Kopien erfolgt zuerst die Server-, dann die Mac-Bereinigung. Bei fehlgeschlagenem
Abruf findet keine Bereinigung statt. Das gilt auch für die Server-Tagesbackups:
Ihre Frist bleibt 30 Tage, die bisherige bedingungslose `find -delete`-Ausführung
entfällt. Während einer Mac-Ausfallzeit können deshalb mehr Sicherungen anfallen.
Ein Status älter als 48 Stunden ist ungültig; ein fehlgeschlagener Lauf markiert
den Status sofort als fehlerhaft. Ein fehlender oder über 48 Stunden alter
Tages-Restore-Nachweis blockiert den Abruf. Der Dienst verschickt keine Meldungen.

## Schutzbedingungen

- Deploy, Tagesbackup, Export und Bereinigung verwenden serverseitig dieselbe
  `flock`-Sperre in `/var/lib/funnelflow/backup-retention/operation.lock`.
  Ein parallel laufender Mac-Abruf wartet bis zum nächsten Stundenlauf.
- Das Deployment erneuert nach erfolgreichem Restore-Test und Release-Wechsel
  die Referenz der wiederherstellbaren Release-Sicherung. Die Übernahme verlangt
  den geerbten Sperrdeskriptor 9; ein ungesperrter Aufruf scheitert.
- Die Release-Referenz und alle neueren Release-Sicherungen bleiben geschützt.
  Für Tagespaare ersetzt ein neuerer, hashgleicher Tages-Restore-Nachweis die
  zeitliche Grenze. Die Release-Referenz mit Journalbaseline bleibt zusätzlich
  zwingend. Der jüngste vollständige Satz jeder Ablage wird stets erhalten.
- Der Server verlangt einen aktuellen externen Journalnachweis vor Export und
  Bereinigung. Journaldateien und Journalarchive werden niemals bereinigt.
- Fehlende Referenzen, Hashabweichungen, veränderte Dateien, Hard-/Symlinks,
  unbekannte Ablagen und unvollständige Paare sperren die betreffenden Aktionen.
  `releaseHolds` und `dailyHolds` halten konkrete Satzkennungen fest.
- Vor jeder Bereinigung wird die vollständige konkrete Vorschau dauerhaft
  unter `stateDir/reviews/` gespeichert. Jeder Satz wird unmittelbar vor der
  Änderung erneut inventarisiert und gehasht. Gelöscht werden ausschließlich
  einzeln benannte Dateien über einen geöffneten Verzeichnisdeskriptor;
  Verzeichnisse werden nur leer entfernt. Es gibt keine rekursive Löschung.
- Maximal 50 Sätze pro Lauf. Teilfehler bleiben im Reviewprotokoll erkennbar;
  unvollständige Sätze werden bei Folgeläufen zur manuellen Prüfung erhalten.

Die Sicherungen enthalten personenbezogene Daten und Laufzeitkonfigurationen.
Runtime-/Staging-Verzeichnisse sind privat (0700), neue Dateien 0600. Übertragung
erfolgt über SSH. Eine darüber hinausgehende Verschlüsselung des Mac-Datenträgers
ist damit nicht nachgewiesen. Kopie und Zustand müssen auf demselben Dateisystem
liegen, damit die geprüften Dateien atomar veröffentlicht werden können.
Ein Abruf ist auf 512 MiB begrenzt; bei Überschreitung stoppt der Dienst sichtbar.

## Bedienung und Einrichtung

Die Runtime enthält `backup-operations.py`, `backup-retention-preview.mjs`,
serverseitig zusätzlich `backup-daily.sh`, sowie eine private `config.json`.
Python 3.9+ und Node 20+ sind erforderlich; keine zusätzlichen Python-Pakete.
Mac-Pfade für Python und Node müssen im LaunchAgent absolut eingetragen sein.

Serverkonfiguration:

```json
{
  "version": 1,
  "role": "server",
  "backupRoot": "/var/backups/funnelflow",
  "stateDir": "/var/lib/funnelflow/backup-retention",
  "node": "/usr/bin/node",
  "retentionDays": { "releases": 30, "daily": 30 },
  "releaseHolds": [],
  "dailyHolds": []
}
```

Auf dem Mac stehen `role: "mac"`, die lokalen absoluten Pfade,
`retentionDays: {"releases": 90, "daily": 30}`, `sshHost` und
`remoteRuntime: "/var/lib/funnelflow/backup-retention"` in der Konfiguration.
Die Runtime liegt unter `~/Library/Application Support/Trichterwerk/BackupRetention`.

```sh
python3 backup-operations.py sync config.json    # Abruf ohne Bereinigung
python3 backup-operations.py preview config.json # konkrete lokale Dateiliste
python3 backup-operations.py run config.json     # geprüfter Abruf und Bereinigung
python3 backup-operations.py status config.json  # letzter erfolgreicher Gesamtstand
```

Ersteinrichtung: Runtime und Konfiguration privat installieren, bestehende
Restore-Referenz anhand ihrer Abnahmebelege übernehmen, neuen Server-Tagesjob
einmal erfolgreich ausführen. Danach auf dem Mac `sync`, Vorschauen für beide
Rechner prüfen und den ersten `run` ausführen. Erst anschließend den LaunchAgent
laden. Der alte Mac-`pull.sh` muss auf den neuen Ablauf umgeleitet werden, damit
seine rekursive 14-Tage-Bereinigung nicht versehentlich erneut läuft. Der bisherige
Server-Cron-Eintrag wird auf die neue Runtime umgestellt, ohne weitere Cronjobs
zu verändern. Laufende Dienste vor Runtime-Updates beenden bzw. sperren.

Für jeden produktiven Restore gilt weiter [ERASURE_RESTORE.md](ERASURE_RESTORE.md):
aktuelles unabhängiges Journal vollständig abgleichen, auch verbindlich wartende
Aufträge. Tagesbackups sind keine transaktional gemeinsamen Datenbank-/Datei-
Snapshots. Lesbare Archive und ein isoliert wiederherstellbarer SQL-Dump ersetzen
keinen vollständigen Wiederanlauftest mit aktuellem Journal und Dateiabgleich.
