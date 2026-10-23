# R11 – bestätigte externe Journalstände

Stand: 23. Oktober 2026. Aufbauend auf PR #190 bestätigt der vorhandene Mac
nun jeden erfolgreich gesicherten Journalstand über den bestehenden SSH-Zugang.
Arbeitsverzeichnis: `../Funnelsoftware-journal-receipts`, Branch
`feat/erasure-backup-receipts`.

## Implementiert und betrieblich geprüft

Die Bestätigung wird erst nach dauerhafter Veröffentlichung und erneutem Lesen
der lokalen Kopie gesendet. Der Server prüft den bestätigten Abschnitt gegen
sein unverändertes Journal. Er speichert Instanz, Sequenz, Hash und Zeitpunkt
atomar unter `/var/lib/funnelflow/erasure-journal-offsite/receipt.json`.
Veraltete Bestätigungen können einen neueren bestätigten Stand nicht ersetzen.
Die bestehende SSH-Berechtigung des vertrauenswürdigen Backupbetreibers bleibt
die Vertrauensgrenze; der Server prüft die Mac-Festplatte nicht selbst.

`source-status` unterscheidet bestätigte und noch offene Journalaufträge. Der
lokale Status prüft bei aktivierter Bestätigung zusätzlich den passenden
Bestätigungsbeleg. Eine fehlgeschlagene Bestätigung lässt die vollständige
lokale Kopie erhalten, meldet den Lauf aber als fehlgeschlagen. Bei einer
verlorenen Antwort bleibt eine bereits gespeicherte Serverbestätigung gültig;
Wiederholung ist möglich.

36 gezielte Tests sind bestanden. Vierzehn neue Fälle prüfen unter anderem
korrekte Reihenfolge, neue Aufträge während der Übertragung, Offline-Fehler,
verlorene Antworten, monotone Bestätigungen, falsche Hashes/Instanzen,
Sperren und getrennte Bestätigungsablage auch bei Pfaden mit abschließendem `/`.

Der Mac-Dienst wurde im Leerlauf angehalten, seine bisherigen Dateien gesichert
und die neue Version mit `confirmRemote: true` installiert. Der erste
selbstständig durch launchd gestartete Lauf ist erfolgreich. Quelle und Mac
bestätigen alle drei vorhandenen Aufträge, keine offenen Einträge. Die vier
Originaldateien des Journals sind vor und nach der Abnahme per SHA-256 identisch.
Es wurden keine Leads, Konten, Regeln oder bestehenden Sicherungen gelöscht.

## Noch keine automatische Aufbewahrung

Diese Bestätigung ist eine Voraussetzung, keine Löschfreigabe. Sie belegt den
extern gesicherten Abschnitt zum jeweiligen Zeitpunkt, nicht die Abwesenheit
späterer Aufträge oder den fortdauernden Zustand der Mac-Festplatte. Vor einer
Wiederherstellung bleiben gestoppte Quellschreiber und der aktuelle Vergleich
mit dem externen Journal erforderlich.

Ein künftiger Worker muss für jeden konkreten Auftrag unter der Journalsperre
Instanz, Sequenz und Hash gegen die externe Bestätigung prüfen. Ohne passenden
Nachweis wartet er. Noch umzusetzen sind bewusste Regelaktivierung, begrenzte
Läufe, UI für Wartezustände und die klare Abgrenzung zwischen widerrufbarer
Planung und verbindlichem Löschauftrag. Fristen, Ausnahmen, wiedergeöffnete Fälle
und laufender Mailversand müssen vor dem verbindlichen Auftrag erneut geprüft
werden. Bestehende manuelle Löschwege warten noch nicht auf Bestätigungen.

Anleitung: [ERASURE_BACKUP.md](deploy/ERASURE_BACKUP.md).
Nachweise: `~/TrichterwerkBackups/reviews/journal-receipts-2026-10-23/`.
