# Aufbewahrungsentwürfe und Vorschau

Unter **Leads → Funnel auswählen → Aufbewahrung planen** kann der verifizierte
Kontoinhaber eine eigene Tagesfrist und deren Begründung als Entwurf speichern.
Die Auswahl gilt nur für den gewählten, nicht gelöschten Funnel. Kundenzugänge
über Workspaces erhalten dadurch keine Berechtigung, Aufbewahrung zu planen.
Die Funktion ist auch im Free-Plan verfügbar; Kontaktfelder gesperrter Leads
werden durch die Vorschau nicht offengelegt.

**Speichern aktiviert keine automatische Löschung und pausiert eine aktive Regel.**
Die Vorschau ist kein dauerhafter Löschauftrag. Die gesonderte ausdrückliche
Aktivierung und Wartefunktion sind in [RETENTION_AUTOMATION.md](RETENTION_AUTOMATION.md)
beschrieben. Bereits verbindlich beauftragte Löschungen sind als solche markiert;
Änderungen und Ausnahmen sind dann nicht mehr möglich. Bestehende manuelle
Löschwege bleiben nutzbar und verwenden weiterhin das Löschjournal.

## Zeitbezug und Ausnahmen

- Allgemeine Leads: ausdrücklich gewählter Modus, Frist ab Erfassungsdatum.
- Abgeschlossene Bewerbungen: Frist ab gespeichertem Abschlussdatum.
  Die Statuswerte `converted` und `lost` gelten als abgeschlossen; bei eigenen
  Spalten gilt deren hinterlegter `legacyStatus` beim Statuswechsel.
- Ein tatsächlicher Wechsel von offen nach abgeschlossen erfasst `closed_at`
  in derselben Transaktion wie Status, Versionszähler, Verlauf und Mailauftrag.
  Ein weiterer abgeschlossener Status erhält dieses Datum. Wiederöffnen löscht
  es; ein späterer Abschluss beginnt eine neue Frist. Ein unveränderter Status
  erzeugt keinen neuen Abschlussnachweis.
- Bestehende Leads erhalten durch die Migration **kein** errechnetes Datum.
  Alte abgeschlossene Fälle ohne Datum bleiben „Nicht beurteilbar“, auch beim
  Wechsel zwischen zwei abgeschlossenen Statuswerten. Ein zukünftiges
  Bezugsdatum wird ebenfalls nicht als gültige Fristbasis behandelt.
- Ein Tag entspricht 24 Stunden. Zeitstempel werden nach der bestehenden
  UTC-Konvention der Anwendung verarbeitet; keine Ableitung aus Kalendermonaten.
- Ausnahmen benötigen einen Grund und einen zukünftigen Prüftermin.
  Nach dem Termin bleiben sie ausgenommen und erscheinen als „Ausnahme prüfen“.
  Nur ausdrückliches Aufheben entfernt die Ausnahme. Sie sperrt keine bewusste
  manuelle Löschung durch den Kontoinhaber.

Entwürfe und Ausnahmen haben unabhängige Versionszähler. Veraltete Änderungen
werden mit HTTP 409 abgelehnt. Auch nach dem Aufheben bleibt die Ausnahmeversion
bestehen, damit eine alte Browseransicht sie nicht unbemerkt wiederherstellt.
Begründungen und Abschlussdatum werden im Betroffenenexport berücksichtigt.
Beim Löschen von Lead, Funnel oder Konto entfernen Fremdschlüsselkaskaden die
zugehörigen Ausnahmedaten bzw. Entwürfe.

Die Vorschau liest einen konsistenten Datenbanksnapshot. Gesamtzahlen umfassen
alle Leads des gewählten Funnels; Details werden in Seiten mit je 50 Einträgen
geladen. Die API liefert keine Namen, E-Mail-Adressen oder Antworten. Die UI
verwendet nur bereits sichtbare Leadnamen aus der vorhandenen Leadübersicht.
Analytics, gelöschte Funnels, Medien und Backups haben keine Regel in diesem Paket.

## Automatik und verbleibender Umfang

Die Automatik prüft Regel, Ausnahmen, Status und laufenden Mailversand vor der
Beauftragung und wartet vor der Löschung auf die bestätigte externe Journalkopie.
Siehe [RETENTION_AUTOMATION.md](RETENTION_AUTOMATION.md). Bestehende Entwürfe
werden nicht automatisch aktiviert. Eine feste Betreiberfrist für Backups oder
pauschale Kundentagesfrist wird nicht aus einem Entwurf abgeleitet.
