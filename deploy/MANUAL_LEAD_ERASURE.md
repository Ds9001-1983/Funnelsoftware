# Manuelle Lead-Löschung mit externer Bestätigung

Bei eingerichtetem unabhängigem Löschjournal beauftragen Einzel-Löschung und
Betroffenenanfrage die Löschung verbindlich. Sie entfernen zunächst keine Daten.
`DELETE /api/leads/:id` und `POST /api/leads/gdpr-erasure` antworten mit HTTP 202
und `{ "status": "queued", "queuedCount": N, "deletedCount": 0 }`. Ohne Treffer
bleiben 404 für die Einzel-Löschung bzw. 200 mit `deletedCount: 0` für die Suche.

Die Auswahl erfolgt unter Journal- und Datensatzsperre innerhalb des angemeldeten
Kontos. Die E-Mail-Suche umfasst auch dessen logisch gelöschte Funnels. Sie erfasst
nur die zum Anfragezeitpunkt ausgewählten stabilen Lead-Kennungen, keine später
hinzukommenden Bewerbungen. Wiederholungen übernehmen vorhandene Aufträge, ohne
sie erneut ins Journal zu schreiben. Bereits durch Aufbewahrungsregeln beauftragte
Leads werden genauso behandelt. Eine manuelle Anfrage aktiviert keine Regel.

Die vorhandenen `retention_leads`-Einträge dienen als gemeinsame Warteschlange
für manuelle und regelbasierte Aufträge, jeweils höchstens 20 Kennungen pro
Eintrag. Das Journalformat und der Mac-Dienst bleiben kompatibel. Ein SQL-Rollback
widerruft einen bereits dauerhaft geschriebenen Eintrag nicht. Auch bei einer
unterbrochenen Sammelanfrage bleiben die bereits geschriebenen Teilaufträge
verbindlich; ein erneuter Versuch ergänzt nur fehlende Kennungen.

Der bestehende Worker läuft jede Minute. Er prüft die Bestätigung des exakten
Journalabschnitts und löscht höchstens 20 Leads pro Lauf. Ohne gültigen externen
Nachweis wartet er. Der Mac bestätigt alle fünf Minuten, solange er angemeldet,
eingeschaltet und verbunden ist. Eine Bestätigung des alten Journalstands reicht
nicht für neue Aufträge. Fehlende, abgelaufene oder unpassende Bestätigungen
führen zu keiner Löschung. Laufender Recruiting-Mailversand verhindert vorerst
auch eine bereits bestätigte Löschung; noch nicht versandte Jobs werden gesperrt.

Die Lead-Antworten enthalten `erasureRequested`. Die Liste kennzeichnet wartende
Aufträge, sperrt Statusänderungen und aktualisiert sich während des Wartens alle
zehn Sekunden. Auch Bearbeitung, Statuswechsel und Ausnahmen werden serverseitig
abgewiesen. Der Betroffenenexport enthält den Auftragsstatus. Zähler, Verläufe,
Ausnahmen und Mailjobs werden erst mit der tatsächlichen Löschung bereinigt.

Vor Restore muss das aktuelle unabhängige Journal vollständig angewendet werden,
auch für bereits verbindliche wartende Aufträge. Die bestehende Offline-Replay-
Funktion unterstützt diese Einträge bereits. Ein Startcheck ersetzt keinen
aktuellen Quellenvergleich und keinen vollständigen Restore-Abgleich.

In isolierten Entwicklungs-/Testumgebungen ohne konfiguriertes Journal bleibt
die unmittelbare Löschung möglich. Produktion hat immer ein Journalverzeichnis;
ein fehlendes oder beschädigtes Journal führt dort nicht zu diesem Ausweichweg.

## Verbleibender Umfang

Kontolöschung durch den Kontoinhaber oder Administrator verwendet weiterhin den
bisherigen Ablauf. Ihre Kaskade kann auch wartende Leads entfernen, ohne auf die
externe Bestätigung zu warten. Dieser gesonderte R11-Punkt benötigt eine dauerhafte
Kontosperre einschließlich Uploads, Veröffentlichungen und Abonnementablauf.
Analytics-Regeln und Aufbewahrung logisch gelöschter Funnels sind ebenfalls separat.
