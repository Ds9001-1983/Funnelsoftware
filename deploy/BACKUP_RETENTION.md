# Sicherungsinventur und Aufbewahrungsvorschau

Die beschlossenen Fristen und der getrennte ausführende Dienst sind in
[BACKUP_AUTOMATION.md](BACKUP_AUTOMATION.md) beschrieben. Der hier beschriebene
Scanner bleibt ausschließlich lesend.

`scripts/backup-retention-preview.mjs` liest ausdrücklich konfigurierte
Sicherungsablagen. Es erzeugt eine konkrete Dateiliste mit Größen und SHA-256,
verändert aber keine Sicherung und besitzt keinen Löschbefehl. Es startet weder
Anwendung noch Datenbank. Das eigenständige Node-Skript benötigt keine Pakete.

Zuerst die Ablagen und eine belegte Wiederherstellungssicherung konfigurieren.
`retentionDays: null` bedeutet, dass keine Frist beschlossen ist. Dann erscheint
kein Löschkandidat. Ganze Tage sind Dauern von je 24 Stunden. Die Frist ist eine
Betreiberentscheidung; Beispielwerte in Vergleichsberichten sind keine Freigabe
und keine pauschale gesetzliche Vorgabe.

```json
{
  "version": 1,
  "roots": [
    {
      "id": "server-releases",
      "path": "/var/backups/funnelflow/releases",
      "kind": "releases",
      "retentionDays": null,
      "holds": []
    }
  ],
  "recoveryAnchor": null
}
```

```sh
node scripts/backup-retention-preview.mjs preview /privat/backup-policy.json
```

Die JSON-Ausgabe enthält die erfassten Ablagen, vollständigen Sicherungssätze,
geschützte Einträge, Prüffälle und konkrete Kandidaten. `readOnly: true` bleibt
immer gesetzt. `preview-json <base64url-config>` ist der gleiche lesende Ablauf
für die Ausführung des Skripts über SSH/stdin; die Konfiguration enthält keine
Zugangsdaten. Fehlertexte geben keine Sicherungsinhalte aus.

## Unterstützte Ablagen

- `releases`: direkte Unterverzeichnisse im Format `YYYYMMDDTHHMMSS-<12 Hex>`.
  Commitkennung, Datenbankdump, Uploadarchiv und Prüfsummen müssen zusammenpassen.
  Vorhandene Journalbaselines müssen vollständig sein und ihre Prüfsummen stimmen.
  Die ursprünglichen absoluten Pfade älterer Prüfsummenlisten werden niemals
  verfolgt; geprüft werden nur die Dateien im ausgewählten Sicherungsverzeichnis.
- `daily`: direkte Paare `db_YYYY-MM-DD_HH-mm.gz` und
  `uploads_YYYY-MM-DD_HH-mm.tar.gz`. Beide Dateien müssen vorhanden und nicht leer
  sein. Ihre Hashes werden erfasst. Das beweist weder eine erfolgreiche
  Wiederherstellung noch einen gemeinsamen Datenbank-/Datei-Snapshot.

Unbekannte Einträge und Unterverzeichnisse werden nicht rekursiv durchsucht und
bleiben geschützt. Dadurch bleiben insbesondere Journalarchive, Reviewbelege,
Sondersicherungen und Skripte außerhalb der automatisch klassifizierten Sätze.
Abweichende historische Layouts, unvollständige Paare, Symlinks, Hardlinks,
wechselnde Dateien und beschädigte Prüfsummen werden zur Prüfung zurückgestellt.
Ein Prüffall bedeutet nicht automatisch, dass die Sicherung beschädigt ist.

## Schutz einer geprüften Wiederherstellungssicherung

Kandidaten entstehen nur mit einem ausdrücklich referenzierten `recoveryAnchor`:

- `rootId` und `entry`: Release-Sicherung in einer konfigurierten Ablage.
- `verifiedAt`: UTC-Zeitpunkt der dokumentierten Wiederherstellungsprüfung.
- `verificationRef`: Verweis auf deren belastbaren Abnahmebeleg.
- `hashes`: SHA-256 aller Dateien des Sicherungssatzes, einschließlich Datenbank,
  Uploads, Journalbaseline und Checkpoint.

Der Scanner liest alle zugehörigen Dateien erneut und gleicht sie mit diesen
Hashes ab. Fehlende, veränderte oder nicht vollständig referenzierte Dateien
sperren sämtliche Kandidaten. Die Referenz muss eine vollständige Journalbaseline
enthalten und darf weder aus der Zukunft stammen noch älter als der aktuelle
Dateistand sein. Der Scanner vertraut der vom Betreiber bereitgestellten
Prüfreferenz; er führt selbst keinen Restore aus und prüft deren externe
Dokumentation nicht. Ein Hashnachweis allein ist kein Wiederherstellungsnachweis.

Geschützt bleiben der referenzierte Sicherungssatz, alle mindestens ebenso neuen
Sicherungen sowie je Ablage der jüngste vollständige Satz. Weitere Ausnahmen
lassen sich über `holds` mit den Satzkennungen festhalten. Fehlt ein ausdrücklich
festgehaltener Satz, wird die gesamte betreffende Ablage zur Prüfung gesperrt.
Bei fehlender oder beschädigter Wiederherstellungsreferenz ist nichts freigegeben.

Optional kann `dailyRecovery` einen zusätzlich geprüften Tages-Restore benennen
(`rootId`, `entry`, `verifiedAt`, `verificationRef`, `hashes` beider Dateien).
Stimmen beide Dateien mit dem belegten Restore überein, darf für diese Tagesablage
die neuere Tagesreferenz als zeitliche Schutzgrenze dienen. Dadurch bleibt die
Tagesaufbewahrung unabhängig von der Deploymenthäufigkeit. Die Release-Referenz
mit Journalbaseline bleibt zwingend; ein ungültiger Tagesnachweis sperrt die
gesamte betreffende Tagesablage. Auch hier prüft der Scanner Hashes und Metadaten,
nicht die externe Restore-Dokumentation selbst.

Zur Altersberechnung wird der jüngste Zeitpunkt aus Name und Dateimetadaten
verwendet; bei Releases zusätzlich der Verzeichniszeitpunkt. Ein altes Namensdatum
macht eine kürzlich geänderte Sicherung nicht fällig. Zukunftszeitpunkte bleiben
von einer Bereinigung ausgeschlossen.

## Verwendung des Ergebnisses

Die Vorschau ist eine Momentaufnahme ohne Schreibsperre. Sie ist kein
Löschprogramm und keine später wiederverwendbare Freigabe. Vor einer künftigen
Bereinigung müssen die beschlossenen Fristen, Ausnahmen und die aktuelle
Wiederherstellungsreferenz feststehen. Kandidaten, Pfade und Hashes müssen dann
unmittelbar vor jeder Änderung erneut geprüft werden. Änderungen des laufenden
Deployments oder Sicherungsdienstes dürfen nicht mit einer Bereinigung kollidieren.

Server-Tagesbackups, Release-Sicherungen und lokale Mac-Kopien haben getrennte
Fristen. Bestehende Zeitpläne und Bereinigungen werden durch dieses Werkzeug
weder geändert noch übernommen. Der Journal-Backupdienst und seine Bestätigungen
bleiben ein eigener Ablauf aus [ERASURE_BACKUP.md](ERASURE_BACKUP.md).

Alte Datenbanksicherungen vor der Journalaktivierung können in einer
Aufbewahrungsvorschau berücksichtigt werden; sie sind damit weiterhin nicht für
eine automatische Wiederherstellung freigegeben. Für jeden Restore gilt
[ERASURE_RESTORE.md](ERASURE_RESTORE.md), einschließlich aktuellem Journalabgleich.
