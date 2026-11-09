# Aufbewahrung von Funnel-Statistiken und gelöschten Funnels

Beide Regeln starten ausgeschaltet und ohne vorgegebene Frist. Migrationen
aktivieren keine Kundenregel und löschen keine vorhandenen Datensätze.
Nur der angemeldete, verifizierte Kontoinhaber darf seine Regel ändern.
Fremde Konten und Kundenbereichsmitgliedschaften erteilen keine Befugnis.

## Bedienung

- **Analytics → Statistik-Aufbewahrung:** Funnel auswählen, Tagesfrist und
  Begründung speichern, Vorschau prüfen und gesondert bestätigen. Die Regel
  umfasst alle Statistikereignisse dieses Funnels ab ihrem Ereigniszeitpunkt.
  Ein Tag bedeutet 24 Stunden. Zukünftige Zeitstempel sind nicht fällig.
- **Funnels → Gelöschte Funnels aufräumen:** kontoweite Wartefrist ab dem
  ausdrücklich gesetzten Löschzeitpunkt planen und bestätigen. Die Vorschau
  zählt alle gelöschten Funnels und zeigt höchstens 50 pro Seite.
  Aktive Funnels und lediglich archivierte Funnels werden nicht ausgewählt.
- Speichern einer geänderten Regel pausiert die Automatik. Aktivierung braucht
  eine höchstens fünf Minuten alte, signierte Vorschau derselben Regelversion
  und eine aktuelle vollständige externe Journalsicherung.
- Bereits dauerhaft beauftragte Löschungen bleiben verbindlich. Pausieren oder
  Verlängern einer Frist betrifft nur künftige Aufträge. Änderungen aus alten
  Tabs werden durch Versionsprüfung abgewiesen.

## Umfang und Schutz

Statistik-Löschung entfernt Ereignisse einschließlich ihrer Metadaten. Seiten-,
Zeitverlaufs- und A/B-Auswertungen verlieren dadurch ältere Detaildaten. Der
gesonderte Gesamtzähler `funnels.views` bleibt erhalten. Metriken verwenden für
die Gesamtquote diesen Zähler, für Detaildiagramme nur vorhandene Ereignisse.
Leads, Bewerbungen und Antworten werden durch diese Regel nicht entfernt.
Plattformbesuche in `platform_visits` bleiben ein separates Thema.

Die endgültige Funnel-Löschung erfasst nur ausdrücklich gelöschte Funnels ohne
Leads **und** ohne Domainzuordnungen. Jeder verbleibende Lead blockiert – auch
bei einer Ausnahme oder einem noch wartenden Lead-Löschauftrag. Die Kontakte
bleiben in der Leadverwaltung zugänglich. Domains zuerst über ihren bisherigen
Verwaltungsablauf entfernen. Der Worker umgeht weder Lead-Ausnahmen noch die
Domainverwaltung.

Beim endgültigen Entfernen löschen die bestehenden Fremdschlüssel Funnel-
Inhalte, Revisionen, Statistikereignisse, Funnel-Regeln und Bereichszuordnungen.
Kontoeigene Vorlagen, Mediathek und Uploads bleiben erhalten: Dateien sind dem
Konto zugeordnet und können von anderen Funnels oder privaten Vorlagen verwendet
werden. Die Bereinigung verwaister Mediendateien gehört nicht zu diesem Paket.

## Gesicherte Ausführung

Der bestehende Journallock serialisiert Regeländerungen, Beauftragung,
Wiederherstellung und Ausführung. Zwei neue Journaltypen:

- `analytics_before`: stabile Funnel-UUID, UTC-Stichtag einschließlich und
  obere Ereignis-ID. Beide Grenzen gelten zusammen. Spätere Ereignisse und
  wiederverwendete numerische Funnel-IDs fallen nicht in alte Aufträge.
- `queued_funnels`: höchstens drei stabile Funnel-UUIDs. Bereits beauftragte
  Funnels können nicht über „Wiederherstellen“ zurückgeholt werden.

Statistikläufe löschen höchstens 500 Ereignisse und schreiben neue Bereiche
für höchstens zehn Funnels pro Lauf. Pro Funnel wird höchstens ein neuer
Statistikbereich je UTC-Kalendertag beauftragt; weitere fällige Ereignisse warten
bis zum nächsten Tag. Das verhindert einen dauerhaften Journaleintrag pro Minute
bei starkem Traffic. Funnel-Läufe beauftragen bzw. entfernen höchstens drei
Funnels. Beide Worker laufen jede Minute. Ohne Journal oder gültige
externe Bestätigung warten sie. Eine Bestätigung eines älteren Abschnitts
deckt neue Aufträge nicht ab; ein unbestätigtes Journalende verhindert zusätzliche
Beauftragungen. Bestätigte Abschnitte bleiben innerhalb der bestehenden
15-Minuten-Gültigkeit ausführbar.

Funnelzeilensperren und erneute Abhängigkeitsprüfung schützen parallele Vorgänge.
Die Lead-Erstellung prüft innerhalb ihrer Transaktion nochmals, dass der Funnel
dem Konto gehört und nicht gelöscht ist. Eine schon laufende öffentliche Anfrage
kann daher nach einem Soft-Delete keine neue Bewerbung mehr einfügen.

`DISABLE_RETENTION_WORKER=1` stoppt auch diese beiden Worker;
`DISABLE_SCHEDULER` unterbindet ihren Start. Vorhandene Aufträge bleiben erhalten.

## Ausrollen und Wiederherstellung

1. Zuerst das Mac-Journalsicherungsskript mit Unterstützung für beide neuen Typen
   aktualisieren und prüfen. Vorgehen: [ERASURE_BACKUP.md](ERASURE_BACKUP.md).
2. Additive Migrationen `20261028_analytics_retention.sql` und
   `20261028_deleted_funnel_retention.sql` mit dem geprüften Release ausrollen.
   Die erste Migration stellt nur den Standard **neuer** Statistikzeitstempel
   explizit auf UTC. Historische Werte bleiben unverändert.
3. Vorschauen und externe Sicherung kontrollieren. Keine Betreiberaktivierung
   fremder Kundenregeln und keine pauschale Kundenfrist voraussetzen.
4. Nach dem ersten neuen Journaleintrag muss jeder Rollback weiterhin diese
   Typen, Sperren und Replay-Regeln unterstützen. Journal nicht kürzen.
5. Restore wie bisher nur mit aktuellem Quellenvergleich und vollständigem
   Offline-Replay nach [ERASURE_RESTORE.md](ERASURE_RESTORE.md).

Offline-Replay entfernt auch verbindlich wartende Statistikaufträge. Zunächst
werden sämtliche Lead-/Kontoaufträge angewendet, danach endgültige Funnelaufträge.
Bleibt dabei ein nicht anderweitig zur Löschung beauftragter Lead übrig, bricht
Replay ab: Die Funnel-Kaskade darf diesen Lead nicht entfernen. Der Startcheck
stellt für beauftragte Funnels die Löschmarkierung wieder her, selbst wenn das
Backup vor dem ursprünglichen Soft-Delete entstand. Er ersetzt keinen Replay.

Nach Offline-Replay sind wiederhergestellte Statistik- und Funnelregeln pausiert
und versioniert. So kann ein altes Backup keine zwischenzeitlich geänderte oder
pausierte Automatik unbemerkt wieder aktivieren. Verbindliche Aufträge werden
trotzdem vollständig abgeglichen. Eine neue Aktivierung erfordert eine neue
Vorschau und Bestätigung.

## Lokale Abnahme

Die Integrationstests verwenden eine frisch angelegte lokale Wegwerfdatenbank
und ein privates temporäres Journal. Sie prüfen unter anderem genaue und alte
Sicherungsbestätigungen, SQL-Rollback nach Journalschreiben, begrenzte parallele
Läufe, Kontotrennung, Fristgrenzen mit Mikrosekunden, UTC bei abweichender DB-Zone,
Lead-/Domain-Schutz, Wiederherstellungssperren sowie echte pg_dump/pg_restore-
Durchläufe und wiederholten Replay. Browserprüfungen decken Vorschau, Validierung,
CSRF, Kontotrennung und ausgeschaltete Automatik auf Desktop und Mobilgeräten ab.
