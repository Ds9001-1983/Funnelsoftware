# Externe Sicherung des Löschjournals auf einem Mac

Der eigenständige Dienst ruft alle fünf Minuten über SSH das Journal vom
Produktionsserver ab. Er läuft als LaunchAgent des angemeldeten Mac-Benutzers.
Der Mac muss eingeschaltet, angemeldet und mit dem Server verbunden sein.
Schlaf, ausgeschalteter Mac, fehlendes Netz oder fehlende SSH-Anmeldung erzeugen
Sicherungslücken. **Das ist keine lückenlose Replikation und keine Zusicherung,
dass jede bestätigte Löschung bereits extern gespeichert ist.**

Der Dienst schreibt ausschließlich auf den Mac. Er benötigt auf dem Server
Node unter `/usr/bin/node` und lesenden Zugriff auf das Journal. Das Programm
wird je Abruf über SSH-stdin ausgeführt; keine Serverinstallation, Migration,
Produktionsänderung oder Anwendungsunterbrechung ist erforderlich. Die vorhandene
SSH-Konfiguration und bekannte Hostschlüssel werden genutzt, unbekannte oder
geänderte Hostschlüssel und Passwortdialoge werden abgelehnt.

## Installation

Benötigt werden macOS, Node 20 oder neuer, eine funktionierende SSH-Verbindung
und ein bereits unabhängig geprüfter Checkpoint. Der erste Abruf muss dessen
Journalidentität und gesamte bisherige Hashkette fortsetzen. Zugangsdaten gehören
nicht in die Konfigurationsdatei oder ins Repository.

Eine private JSON-Datei (0600) außerhalb des Repositories anlegen:

```json
{
  "version": 1,
  "host": "backup-reader@production-host",
  "source": "/var/lib/funnelflow/erasure-journal",
  "destination": "/Users/NAME/TrichterwerkBackups/erasure-journal/automatic",
  "maxAgeSeconds": 900,
  "initialCheckpoint": {
    "version": 1,
    "instanceId": "AUS-DEM-GEPRUEFTEN-CHECKPOINT",
    "sequence": 3,
    "hash": "AUS-DEM-GEPRUEFTEN-CHECKPOINT"
  }
}
```

Die Platzhalter durch den tatsächlichen SSH-Zugang, absoluten Zielpfad und
unveränderten Inhalt des unabhängig gesicherten Checkpoints ersetzen. Kein
neues Journal und keinen geratenen Checkpoint erzeugen.

```sh
node scripts/install-erasure-backup.mjs /absoluter/pfad/config.json
```

Der Installer prüft zuerst einen echten Abruf. Anschließend kopiert er Programm
und Konfiguration nach `~/Library/Application Support/Trichterwerk/JournalBackup/`
und lädt `~/Library/LaunchAgents/de.trichterwerk.erasure-journal-backup.plist`.
`RunAtLoad` startet einen ersten Lauf; `StartInterval=300` weitere Läufe. Der
absolute Pfad der installierenden Node-Version wird fest hinterlegt. Nach dem
Entfernen oder Wechsel dieser Node-Installation den Dienst aktualisieren.

Der Agent verwendet keine interaktive Shell. Private Verzeichnisse erhalten
0700, Dateien 0600. Programm und Konfiguration liegen außerhalb des Desktop-
Arbeitsverzeichnisses, damit die Sicherung unabhängig vom Checkout bleibt.

## Prüfungen und Ablage

Jeder Abruf verwendet eine neue zufällige Anforderungskennung. Die Quelle liest
nur vollständige, unveränderliche Journaldateien und prüft ihre Kette zweimal;
eine zwischenzeitliche Erweiterung führt zu einem fehlgeschlagenen Lauf und
wird beim nächsten Abruf erneut versucht. Der Mac validiert Struktur, Kennungen,
Dateinamen, Reihenfolge, Hashkette und Checkpoint erneut. Eine andere Instanz,
ein verkürztes Journal oder ein umgeschriebener bereits gesicherter Abschnitt
werden abgelehnt. Kontaktinhalte und unbekannte Felder sind nicht zulässig.

SSH-Läufe haben ein Zeitlimit von 60 Sekunden. Die Sicherung ist auf 100.000
Aufträge und 64 MiB je Export begrenzt. Überschreiten dieser Grenzen ist ein
Fehler, keine stillschweigende Kürzung. Für größere Journale muss der Dienst
vorher auf ein geprüftes inkrementelles Verfahren erweitert werden.

Neue Journalstände liegen unveränderlich unter:

```text
automatic/
  snapshots/<zeitpunkt-zufallskennung>/
    journal/anchor.json
    journal/000000000001.json ...
    checkpoint.json
  latest.json
  status.json
```

Dateien werden vor der Veröffentlichung per fsync gesichert. Ein atomarer Wechsel
von `latest.json` erfolgt erst nach vollständiger lokaler Kopie. Bei unverändertem
Journal wird der vorhandene Stand wiederverwendet und nur der Zeitpunkt des
erfolgreichen Abrufs erneuert. Fehler erhalten die letzte erfolgreiche Kopie.
Es gibt keine automatische Bereinigung bestehender Sicherungen.

## Betrieb und Fehler erkennen

```sh
NODE=/absoluter/pfad/zur/installierten/node
RUNTIME="$HOME/Library/Application Support/Trichterwerk/JournalBackup"
"$NODE" "$RUNTIME/backup.mjs" status "$RUNTIME/config.json"
launchctl print "gui/$(id -u)/de.trichterwerk.erasure-journal-backup"
tail -20 "$RUNTIME/backup.log"
```

`status` liefert Exitcode 1, wenn der letzte Abruf fehlgeschlagen ist, der letzte
erfolgreiche Abruf älter als 15 Minuten ist, die Uhr rückwärts sprang, lokale
Dateien beschädigt sind oder ein Lauf noch gesperrt ist. Die 15 Minuten sind
eine betriebliche Überwachungsschwelle, **kein Aktualitätsnachweis für Restore**.
Es werden keine E-Mails oder Push-Nachrichten verschickt. Statusdatei und
LaunchAgent-Log sind die lokalen Kontrollstellen; sie müssen beobachtet werden.

Ein Wiederholungslauf ist möglich mit `run` statt `status`. Ein Verbindungsfehler
wird beim nächsten planmäßigen Abruf erneut versucht. Nach einem harten Abbruch
kann `.backup-lock` bestehen bleiben. In diesem Fall zuerst mit `launchctl print`
und der Prozessliste sicherstellen, dass kein Abruf mehr läuft. Erst danach das
leere Sperrverzeichnis mit `rmdir` entfernen und erneut sichern. Der Dienst
entfernt keine angeblich veralteten Sperren auf Verdacht.

Fehlt `latest.json`, obwohl Snapshots vorhanden sind, bleibt die Sicherung
gesperrt. Den letzten vollständigen Stand und seine Vertrauenskette manuell
prüfen; nicht durch Leeren des Zielverzeichnisses oder Neuerzeugen eines
Checkpoints umgehen. Unvollständige `.tmp-*`-Verzeichnisse sind keine freigegebenen
Sicherungen und werden nicht automatisch gelöscht.

Dienst anhalten:

```sh
launchctl bootout "gui/$(id -u)/de.trichterwerk.erasure-journal-backup"
```

Vor Updates einen laufenden Abruf fertig werden lassen, dann den Agenten
anhalten und den Installer erneut ausführen. Nach jedem Update mit `status` und
`launchctl print` prüfen, dass der neue Lauf erfolgreich war. Das Dienstlog wird
nicht automatisch rotiert; seine Größe gehört zur Betriebskontrolle.

## Verwendung vor einer Wiederherstellung

Den Ablauf aus [ERASURE_RESTORE.md](ERASURE_RESTORE.md) beibehalten. Zuerst die
Quellanwendung und schreibenden Dienste stoppen. Anschließend einen letzten Abruf
und einen separaten aktuellen Vergleich ausführen:

```sh
"$NODE" "$RUNTIME/backup.mjs" run "$RUNTIME/config.json"
"$NODE" "$RUNTIME/backup.mjs" verify-current "$RUNTIME/config.json"
```

`verify-current` lädt den Quellstand erneut über SSH und vergleicht ihn mit der
vollständig geprüften lokalen Kopie. Bei Übereinstimmung gibt es Journalpfad,
Checkpointdatei und Prüfzeitpunkt aus. Beide Dateien gehören zusammen und sind
mit dem bestehenden Restore-Werkzeug kompatibel. Diese Ausgabe ersetzt nicht
die Prüfung, dass die Quellinstallation während des gesamten Restore stillsteht.
Die kopierten Journale enthalten nur die Originaldateien; ihr Checkpoint liegt
absichtlich neben dem Journalverzeichnis.

**Ist die Quelle verloren oder nicht erreichbar, scheitert `verify-current`.**
Ein zuletzt grüner Status oder eine aktuelle lokale Uhrzeit beweisen nicht, dass
nach dem letzten Abruf keine Löschung mehr stattfand. Ohne anderweitig belegte
Vollständigkeit bleibt die öffentliche Wiederinbetriebnahme gesperrt. Der
Mac-Dienst allein erfüllt deshalb keine Voraussetzung für eine garantiert
verlustfreie automatische Bereinigung. Deren Aktivierung bleibt gesondert offen.

## Abnahme

`scripts/erasure-journal-backup.test.mjs` prüft vollständige und leere Journale,
Erweiterung ohne Verlust früherer Kopien, Wiederholungen, Verbindungsfehler,
Veraltung, rückwärts laufende Uhr, fehlende oder beschädigte Dateien,
Instanzwechsel, Rücksprung, umgeschriebene Historie, Anfragekennung,
Dateiberechtigungen, Symlinks, Parallelität, Sperren und Restore-Kompatibilität.
Der Export wird zusätzlich als tatsächliches eigenständiges stdin-Programm
geprüft. Der Installer erzeugt einen mit `plutil` prüfbaren LaunchAgent.
