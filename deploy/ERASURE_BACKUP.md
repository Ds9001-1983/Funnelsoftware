# Externe Sicherung des Löschjournals auf einem Mac

Der eigenständige Dienst ruft alle fünf Minuten über SSH das Journal vom
Produktionsserver ab. Er läuft als LaunchAgent des angemeldeten Mac-Benutzers.
Der Mac muss eingeschaltet, angemeldet und mit dem Server verbunden sein.
Schlaf, ausgeschalteter Mac, fehlendes Netz oder fehlende SSH-Anmeldung erzeugen
Sicherungslücken. **Das ist keine lückenlose Replikation und keine Zusicherung,
dass jede bestätigte Löschung bereits extern gespeichert ist.**

Der Abruf schreibt die Sicherung auf den Mac. Mit `confirmRemote: true`
legt er zusätzlich eine separate Bestätigung auf dem Quellserver ab. Dafür
benötigt der SSH-Benutzer Schreibzugriff auf das benachbarte private
Bestätigungsverzeichnis; das Journal selbst wird weiterhin nur gelesen.
Auf dem Server wird Node unter `/usr/bin/node` benötigt. Das Programm
wird je Abruf über SSH-stdin ausgeführt; keine Serverinstallation, Migration,
Änderung an Anwendungsdaten oder Anwendungsunterbrechung ist erforderlich. Die vorhandene
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
  "confirmRemote": true,
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
Bei Updates muss der vorhandene Dienst zuerst im Leerlauf angehalten werden;
der Installer beendet keinen laufenden Sicherungsdienst automatisch.
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
  receipt.json  # bei aktivierter Bestätigung
```

Dateien werden vor der Veröffentlichung per fsync gesichert. Ein atomarer Wechsel
von `latest.json` erfolgt erst nach vollständiger lokaler Kopie. Bei unverändertem
Journal wird der vorhandene Stand wiederverwendet und nur der Zeitpunkt des
erfolgreichen Abrufs erneuert. Fehler erhalten die letzte erfolgreiche Kopie.
Es gibt keine automatische Bereinigung bestehender Sicherungen.

## Bestätigung des extern gesicherten Journalstands

`confirmRemote: true` aktiviert einen zweiten SSH-Aufruf nach vollständiger,
lokal veröffentlichter und erneut eingelesener Sicherung. Der Mac bestätigt
dabei genau deren Instanz, Sequenz und Hash. Ohne diese Option bleibt der
bisherige reine Abruf kompatibel. Vor der Umstellung bestehende Programme und
Konfiguration sichern, den alten Agenten im Leerlauf stoppen und neu installieren.

Der Quellserver prüft, dass die Bestätigung zu einem echten Abschnitt seines
Journals gehört. Er speichert sie atomar und mit fsync unter
`/var/lib/funnelflow/erasure-journal-offsite/receipt.json` (allgemein:
`<normalisierter-Journalpfad>-offsite/receipt.json`). Das Verzeichnis liegt
außerhalb des Journals und enthält ausschließlich Checkpoint und Serverzeitpunkt,
keine Kontaktinhalte. Eine Sperre serialisiert Bestätigungen; eine ältere
Bestätigung darf einen neueren bestätigten Stand nicht überschreiben.

Der authentifizierte SSH-Zugang des Sicherungsbetreibers ist die Vertrauensgrenze.
Der Server kann die Mac-Festplatte nicht selbst prüfen. Eine Bestätigung belegt,
was der vertrauenswürdige Client nach dauerhafter Speicherung bestätigt hat;
sie ist kein Schutz gegen nachträglichen Festplattenverlust oder Manipulation
durch den Betreiber. Sie darf nicht manuell aus der Quellkopie erzeugt werden.

Wenn inzwischen weitere Aufträge im Journal stehen, wird nur der tatsächlich
kopierte Abschnitt bestätigt. `source-status` prüft den bestätigten Abschnitt
gegen das jetzige Journal und gibt `coveredThrough` sowie `pendingRecords` aus:

```sh
node scripts/erasure-journal-backup.mjs source-status /var/lib/funnelflow/erasure-journal
```

Exitcode 0 bedeutet, dass alle beim Lesen vorgefundenen Aufträge bestätigt sind.
Noch nicht bestätigte Einträge, fehlende, falsche oder beschädigte Bestätigungen
führen zu Exitcode 1. Diese Prüfung sperrt keine laufenden Journal-Schreiber und
ist daher nur eine Momentaufnahme. Ein künftiger Löschworker muss unter derselben
Sperre wie die Journal-Schreiber den **konkreten Auftrag** mit Instanz, Sequenz und
Hash prüfen; eine frühere grüne Momentaufnahme genügt nicht.

Bei Fehlern im Bestätigungsaufruf bleibt die lokale Kopie erhalten, der lokale
Status wird jedoch als fehlgeschlagen markiert. Eine verlorene Antwort darf die
bereits gespeicherte Serverbestätigung nicht zurücksetzen; Wiederholung ist
möglich. Der lokale Status enthält `remoteConfirmation: true` nur bei aktivierter
Bestätigung und passendem lokal gespeichertem Bestätigungsbeleg. Er behauptet
nicht, dass seitdem keine neuen Journalaufträge hinzugekommen sind.

Nach einem harten Abbruch kann auf dem Server `.receipt-lock` bestehen bleiben.
Vor manuellem Entfernen sicherstellen, dass kein Bestätigungsprozess läuft.
Bestätigungsdaten gehören nicht zu einer zurückzuspielenden alten Anwendungskopie.
Sie ersetzen weder das externe Journal noch den finalen aktuellen Quellenvergleich.

**Diese Erweiterung aktiviert keine Löschung.** Der begrenzte Löschworker mit
bewusster Regelaktivierung, überprüfbaren Wartezuständen und erneuter Prüfung von
Ausnahmen, Status und Mailversand muss gesondert implementiert und abgenommen
werden. Bestehende manuelle Löschwege warten noch nicht auf diese Bestätigung.

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
