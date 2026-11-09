# R11 – begonnener Betroffenenexport

Stand: 21. Oktober 2026. Nach Abschluss von **eigenen Domains und SSL** wird
der Betroffenenexport fortgesetzt. Noch nicht produktiv installiert.

Branch `fix/subject-data-export`, mit Main `5f6411d115054e8442cfbcf90b8cf8b78df79af8`
abgeglichen. Der CI-Abgleich erhält Export- und Domain-Regressionstests.

Umgesetzt: Export mit Lead-Antworten, Statusereignissen und Recruiting-Mailinhalt,
Suche nach früheren Mail-Empfängern, Kundenkontentrennung, wiederholbarem
Lesesnapshot, POST-Download ohne E-Mail in der URL und `no-store`.
Bestehender GET bleibt erhalten. Oberfläche nennt Umfang und manuell zu
prüfende zusätzliche Datenbereiche. E-Mail-Normalisierung für Export und
bestehende Löschung ist angeglichen.

Sieben neue Datenbanktests und ein mobiler Browserablauf sind erfolgreich und
in CI eingebunden. Beide Typprüfungen sind erfolgreich. Die falsche Erwartung
für Funnel-DELETE ist auf 204 korrigiert. Der negative CSRF-Test erzeugt die
erwartete 403-Meldung. Die Abnahme umfasst Free-Plan-Maskierung, gelöschte
Funnels, Kontentrennung, Download und Löschkaskaden ausschließlich mit synthetischen
Daten in der isolierten lokalen Testumgebung.

Lokale isolierte Testdatenbank auf Port 55439; Umgebung und Rohprotokoll unter
`~/TrichterwerkBackups/reviews/subject-export-2026-10-20/`.
Kein Produktionskonto, keine Produktivdatei und keine Produktivdatenbank geändert.

Offen: vollständige CI, PR und Veröffentlichung des Exports.
Aufbewahrungsregeln, Backup-Fristen und ein für Wiederherstellungen nutzbarer
Löschprozess wurden nicht implementiert. R11 ist insgesamt weiter offen.
