# Automatische Aufbewahrung mit bestätigter Journalsicherung

Die Automatik ist standardmäßig pro Funnel ausgeschaltet. Unter „Aufbewahrung
planen“ Frist, Fristbeginn und Begründung speichern, Vorschau und Ausnahmen
prüfen und die dauerhafte Löschung ausdrücklich bestätigen. Die Aktivierung
benötigt eine aktuelle Vorschau (höchstens fünf Minuten) und eine aktuelle
externe Sicherungsbestätigung. Nur der verifizierte Kontoinhaber darf aktivieren.
Speichern einer geänderten Regel pausiert die Automatik und benötigt eine neue
Aktivierung. Versionsprüfungen verhindern das Überschreiben neuerer Änderungen.

Bei Bewerbungen zählen ausschließlich belegte Abschlussdaten der Status
„Konvertiert“ und „Verloren“. Wiederöffnen setzt dieses Datum zurück. Unbelegte
Altfälle bleiben erhalten. Bei allgemeinen Leads beginnt die Frist mit der
Erfassung; dieser Modus schließt offene Leads ein. Ein Tag bedeutet 24 Stunden.
Begründete Ausnahmen bleiben auch nach ihrem Prüftermin wirksam. Gelöschte
Funnels und Konten sowie nicht bestätigte Konten erzeugen keine neuen Aufträge.
Analytics, externe Integrationen, Postfächer und die Löschung alter Backups sind
nicht Bestandteil dieser Regel.

## Verbindlicher Auftrag und Wartezustand

Der Server prüft jede Minute bis zu 20 neue Fälle. Vor der Beauftragung werden
Regel, Ausnahme, Status, Frist und laufender Recruiting-Mailversand geprüft.
Die Journalsperre serialisiert Aktivierung, Änderungen, Ausnahmen und Beauftragung.
Ein nicht blockierendes Lead-Schloss schützt laufenden SMTP-Versand.

Ein Auftrag enthält höchstens 20 stabile Lead-UUIDs unter dem Journaltyp
`retention_leads`. Sobald er dauerhaft im Journal steht, ist er verbindlich,
auch wenn unmittelbar danach die SQL-Transaktion abbricht. Seine Leads erscheinen
als „Löschung beauftragt“ und können nicht mehr geändert, wiedergeöffnet oder
ausgenommen werden. Noch nicht versandte automatische Mails werden storniert.
**Pausieren stoppt neue Aufträge; bereits verbindliche Aufträge bleiben bestehen.**

Der vorhandene Mac ruft alle fünf Minuten das Journal ab, schreibt und prüft die
lokale Kopie und bestätigt erst danach den genauen Stand über SSH. Der Server
prüft Instanz, Sequenz und Hash gegen sein Journal. Er löscht höchstens 20 Leads
pro Lauf, deren Auftrag im bestätigten Abschnitt liegt. Die Bestätigung darf
höchstens 15 Minuten alt sein. Bei fehlendem oder fehlerhaftem Beleg wartet er;
er wartet auch mit weiteren Aufträgen, solange ein Journalende unbestätigt ist.
Damit sind Offline-Zeiten des Macs ein Wartezustand. Nach erneuter Sicherung
setzt der Worker automatisch fort. Der Mac muss dafür eingeschaltet, angemeldet
und verbunden sein. Datenbankkaskaden entfernen zugehörige Statusverläufe,
Mailjobs und Ausnahmen; der Funnelzähler wird in derselben Transaktion angepasst.

`ERASURE_JOURNAL_DIR` muss konfiguriert und die Datenbank daran gebunden sein.
`DISABLE_RETENTION_WORKER=1` stoppt die regelmäßigen Läufe. Aktivierte Regeln und
bereits verbindliche Aufträge bleiben erhalten. Der Worker läuft zusätzlich zu
bestehenden Workern, aber nicht bei gesetztem `DISABLE_SCHEDULER`.

## Betrieb, Update und Wiederherstellung

1. Zuerst das Mac-Sicherungsskript aktualisieren: Es muss `retention_leads`
   verstehen. Im Leerlauf stoppen, Installer ausführen und Status prüfen,
   entsprechend [ERASURE_BACKUP.md](ERASURE_BACKUP.md).
2. Additive Migration `20261023_retention_activation.sql` und neue Anwendung
   ausrollen. Bestehende Entwürfe erhalten keine automatische Freigabe.
3. Vor einer Aktivierung den aktuellen Sicherungsstatus und die Vorschau prüfen.
   Ein ausgeschalteter Mac wird spätestens nach Ablauf der 15-Minuten-Schwelle
   als fehlende aktuelle Bestätigung angezeigt. Bereits bestätigte Aufträge
   dürfen innerhalb dieser Schwelle abgeschlossen werden.
4. Nach dem ersten automatischen Journaleintrag keine alte Anwendung bzw. kein
   altes Restore-/Backuptool einsetzen, das diesen Typ nicht versteht. Solche
   Versionen verweigern das Journal. Ein Rollback benötigt kompatiblen Code.
5. Restore weiterhin ausschließlich nach [ERASURE_RESTORE.md](ERASURE_RESTORE.md).
   Auch verbindliche, noch wartende Aufträge werden beim Offline-Replay entfernt.
   Backups und Journale werden niemals automatisch zurückgesetzt oder gelöscht.

Die Bestätigung vertraut dem bestehenden SSH-Zugang des Backupbetreibers. Sie
belegt die gesicherte Kopie zum Bestätigungszeitpunkt, nicht den späteren Zustand
der Mac-Festplatte. Manuelle Lead-Löschungen verwenden ebenfalls diese
Warteschlange, siehe [MANUAL_LEAD_ERASURE.md](MANUAL_LEAD_ERASURE.md).
Kontolöschungen warten weiterhin nicht auf eine externe Bestätigung. Für einen
vollständigen Restore bleibt der aktuelle Quellenabgleich notwendig.

Die Datenbanktests prüfen Offline-Wartezeit, genaue Bestätigung, Neustart,
Abbruch zwischen Journal und SQL-Commit, Ausnahmen, Wiederöffnen, begrenzte und
parallele Läufe, SMTP-Sperren sowie Wiederherstellung mit echtem pg_dump/pg_restore.
