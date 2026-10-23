# R11 – Löschautomatik mit bestätigter externer Sicherung

Stand: 23. Oktober 2026. Der vorhandene Mac bestätigt erfolgreich gesicherte
Journalstände über SSH. Darauf aufbauend ist die ausdrücklich gewünschte
Löschautomatik mit Wartefunktion implementiert. Arbeitsverzeichnis:
`../Funnelsoftware-journal-receipts`, Branch `feat/erasure-backup-receipts`.

## Verhalten

Fristen werden ausdrücklich pro Funnel aktiviert. Gespeicherte Entwürfe sind
weiterhin inaktiv. Die Aktivierung benötigt eine aktuelle Vorschau, Bestätigung
und externe Sicherungsbereitschaft. Änderungen pausieren die Regel. Ausnahmen,
Wiederöffnen und ungeklärte Abschlussdaten verhindern neue Bewerbungsaufträge.

Der Worker prüft jede Minute begrenzte Mengen. Er schreibt einen verbindlichen
Auftrag mit höchstens 20 Lead-UUIDs. Dessen Daten bleiben bis zur Bestätigung
des genauen Journalabschnitts auf dem Mac erhalten. Ohne passende, höchstens
15 Minuten alte Bestätigung wartet die Ausführung. Bei einer Unterbrechung
bleibt das Journal maßgeblich, auch wenn die Datenbanktransaktion abbricht.

Beauftragte Leads sind in der Oberfläche gesondert sichtbar und gegen Änderungen
sowie automatische Recruiting-Mails gesperrt. Bereits beauftragte Löschungen
werden durch Pausieren nicht zurückgenommen. Das wird vor der Aktivierung
angezeigt. Der Betroffenenauszug enthält ebenfalls den Beauftragungsstatus.
Die endgültige Löschung entfernt zugehörige Daten per Datenbankkaskade und
aktualisiert den Funnelzähler in derselben Transaktion.

Der Mac-Dienst wurde für den neuen Journaltyp aktualisiert. Bestätigungen liegen
getrennt vom unveränderten Journal unter
`/var/lib/funnelflow/erasure-journal-offsite/receipt.json`. Der bestehende
SSH-Zugang ist die Vertrauensgrenze. Manuelle Löschwege warten weiterhin nicht
auf den Mac; vor Restore bleibt ein aktueller Abgleich erforderlich.

## Prüfung und Auslieferung

Gezielt geprüft: sichere Übertragung/Bestätigung, Offline-Wartezeit, genaue
Journalpräfixe, falsche und veraltete Belege, unveränderte Ausgangsregeln,
Änderungssperren, Ausnahmen, Wiederöffnen, begrenzte parallele Läufe, SMTP-Sperren,
Unterbrechung zwischen Journal und SQL sowie echter pg_dump/pg_restore-Replay.
Browserprüfung: Vorschau, Ausnahmen, ausgeschaltete Automatik, gesperrte
Aktivierung ohne Sicherungsbeleg, Fremdzugriff und manipulierte Vorschautokens.
Auslieferung und abschließende Live-Nachweise werden nach CI ergänzt.

Keine vorhandene Kundenregel wurde aktiviert. Die Tests verwenden ausschließlich
synthetische Daten in getrennten lokalen Testdatenbanken.

Anleitungen: [RETENTION_AUTOMATION.md](deploy/RETENTION_AUTOMATION.md),
[ERASURE_BACKUP.md](deploy/ERASURE_BACKUP.md), [ERASURE_RESTORE.md](deploy/ERASURE_RESTORE.md).
Nachweise: `~/TrichterwerkBackups/reviews/retention-auto-2026-10-23/`.
