# R11 – automatische externe Journalsicherung auf dem Mac

Stand: 23. Oktober 2026. Der Betreiber hat den vorhandenen Mac als Sicherungsziel
gewählt. Implementierung auf `feat/erasure-journal-offsite` im Worktree
`../Funnelsoftware-journal-backup`. Der lokale Dienst ist installiert und aktiv;
Anwendung und Produktionsrelease `93cb8114de1d6a2a01241b0725cf9d7630bd732c`
bleiben unverändert.

## Ergebnis

Der LaunchAgent `de.trichterwerk.erasure-journal-backup` ruft alle 300 Sekunden
über die vorhandene SSH-Verbindung das unabhängige Löschjournal ab. Programm
und Konfiguration liegen unter
`~/Library/Application Support/Trichterwerk/JournalBackup/`;
Sicherungen unter `~/TrichterwerkBackups/erasure-journal/automatic/`.

Erstabruf und erster durch launchd gestarteter Lauf sind erfolgreich (Exitcode 0).
Das Journal enthält drei Aufträge. Die Initialisierung ist gegen den unabhängig
gesicherten Checkpoint vom 22. Oktober gepinnt. Der anschließende separate
Quellenvergleich bestätigt den gleichen Stand; der originale Parser der
Anwendung akzeptiert die lokale Kopie und denselben Checkpoint.

22 automatisierte Tests sind bestanden. Sie prüfen auch Rücksprung, veränderte
Historie, beschädigte/fehlende Dateien, falsche Anfragekennung, Dateirechte,
Symlinks, Offline-Fehler, Veraltung, Parallelität und Restore-Parserkompatibilität.
Eine geänderte Quelle erzeugt einen neuen unveränderlichen Snapshot; unveränderte
Stände erneuern nur den Prüfzeitpunkt. Kein Snapshot wird automatisch gelöscht.

## Betrieb und Grenzen

Ein gültiger lokaler Status verlangt einen erfolgreichen Abruf innerhalb der
letzten 15 Minuten. Fehler und alte Sicherungen führen zu Exitcode 1; Service-
Log und Statusdatei stehen zur lokalen Kontrolle bereit. Es gibt keine externe
Benachrichtigung. Anleitung: [ERASURE_BACKUP.md](deploy/ERASURE_BACKUP.md).

Der Mac muss eingeschaltet, angemeldet und verbunden sein. Während Offline-
Zeiten können weitere Löschungen auf dem Server entstehen. Die jetzige Sicherung
ist daher keine lückenlose Replikation. `verify-current` benötigt die erreichbare
Quelle und verlangt Übereinstimmung mit der Kopie; vor einem Restore muss die
Quellanwendung gestoppt bleiben. Ein Quellverlust lässt sich nicht allein mit
einem zuletzt grünen lokalen Status freigeben.

Damit ist der beauftragte automatische Mac-Abruf eingerichtet. Eine garantierte
externe Sicherung jeder bestätigten Löschung, automatische Aufbewahrung und
Backup-Fristen bleiben offen. Es wurden keine Produktionsdaten verändert,
keine Serverdienste installiert und keine bestehenden Sicherungen bereinigt.

Nachweise: `~/TrichterwerkBackups/reviews/journal-offsite-2026-10-23/`.
