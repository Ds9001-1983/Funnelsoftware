# Betroffenenanfragen vorbereiten

In der Lead-Verwaltung öffnet **DSGVO** die Suche nach einer E-Mail-Adresse.
Der angemeldete Kontoinhaber muss seine eigene E-Mail bestätigt haben.
Die Funktion ist auch im Free-Plan verfügbar und umfasst noch vorhandene
Daten aus gelöschten Funnels.

**Exportieren** lädt eine JSON-Datei mit passenden Leads, Antworten,
Antwort-Snapshots, gespeicherten Einwilligungsangaben, Statusverlauf und
Recruiting-Mailjobs einschließlich Inhalt und Versandstatus. Der Export
enthält keine Kontopasswörter oder Integrations-Zugangsdaten.

Groß-/Kleinschreibung und äußere Leerzeichen werden bei der E-Mail-Suche
ignoriert. Auch frühere Recruiting-Mail-Empfänger werden durchsucht. Passt
nur eine frühere Empfängeradresse, wird die gespeicherte Mail ausgegeben;
die aktuellen Kontaktdaten und übrigen Statusereignisse des Leads werden
dadurch nicht mit ausgegeben. Spaltenbezeichnungen beschreiben die aktuell
gespeicherte Pipeline, nicht rückwirkend frühere Bezeichnungen.

Die Anwendung verwendet POST, damit die Suchadresse nicht in der URL landet.
Das Ergebnis trägt `Cache-Control: no-store`; der Dateiname enthält das Datum.
Der bisherige GET-Endpunkt bleibt für bestehende Clients verfügbar.
Alle Abfragen laufen kontogebunden in einem konsistenten Lesesnapshot.

Die Datei dient der Prüfung durch den Verantwortlichen. Vor einer Weitergabe
Identität, Umfang und Angaben zu anderen Personen prüfen. Weitere Adressen
und Suchmerkmale, Supportmeldungen und Anhänge, Postfächer, Integrationen und
Backups gesondert berücksichtigen. Ergänzende Auskunftsinformationen und die
eigentliche Antwort werden durch den Verantwortlichen zusammengestellt.

**Daten löschen** entfernt Leads mit der aktuell passenden E-Mail-Adresse
samt Statusereignissen und Recruiting-Mailjobs aus diesem Konto. Stimmen nur
frühere Empfängeradressen, werden dadurch keine aktuellen Leads anderer
Adressen entfernt. Bereits versandte Kopien und externe Datenbereiche bleiben
gesondert zu bearbeiten. Eine endgültige Löschung erfordert die Bestätigung
in der Oberfläche; Kontodaten anderer Kunden sind nicht betroffen.

Dieses Paket legt keine allgemeinen Aufbewahrungsfristen fest und bereinigt
keine Alt-Backups. R11 bleibt hinsichtlich kundengesteuerter Fristen und
Wiederherstellung bereits gelöschter Daten gesondert offen.
