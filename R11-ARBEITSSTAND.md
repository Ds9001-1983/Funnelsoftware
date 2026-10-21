# R11 – begonnener Betroffenenexport

Stand: 21. Oktober 2026. Der Betreiber hat im Chat **eigene Domains und SSL**
priorisiert. Dieser begonnene Stand ist lokal gesichert, nicht fertig geprüft,
nicht als PR veröffentlicht und nicht produktiv installiert.

Branch `fix/subject-data-export`, Basis `d76dae23bf66e0214b75f36d60f8540796745de1`.

Umgesetzt: Export mit Lead-Antworten, Statusereignissen und Recruiting-Mailinhalt,
Suche nach früheren Mail-Empfängern, Kundenkontentrennung, wiederholbarem
Lesesnapshot, POST-Download ohne E-Mail in der URL und `no-store`.
Bestehender GET bleibt erhalten. Oberfläche nennt Umfang und manuell zu
prüfende zusätzliche Datenbereiche. E-Mail-Normalisierung für Export und
bestehende Löschung ist angeglichen.

Sieben neue Datenbanktests und ein mobiler Browserablauf sind geschrieben und
in CI eingebunden. Sie sind noch nicht vollständig bestanden. Ein früher
Typprüfungslauf war erfolgreich; spätere Testergänzungen erneut prüfen.
Der erste Browserlauf scheitert an einer falschen Testerwartung: Funnel-DELETE
liefert korrekt 204, der Test erwartet in Zeile 62 noch 200. Diesen Test korrigieren
und weiter ausführen. Der erwartete negative CSRF-Test erzeugt eine 403-Meldung.

Lokale isolierte Testdatenbank auf Port 55439; Umgebung und Rohprotokoll unter
`~/TrichterwerkBackups/reviews/subject-export-2026-10-20/`.
Kein Produktionskonto, keine Produktivdatei und keine Produktivdatenbank geändert.

Offen: Tests abschließen, Exportumfang/Fehlerfälle prüfen, Dokumentation und PR.
Aufbewahrungsregeln, Backup-Fristen und ein für Wiederherstellungen nutzbarer
Löschprozess wurden nicht implementiert. R11 ist insgesamt weiter offen.
