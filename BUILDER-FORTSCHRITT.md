# Builder-Weiterentwicklung

Auftrag: Die Kundenanfrage umsetzen und veröffentlichen sowie die zuvor
erarbeiteten Builder-Vorschläge aus der ursprünglichen Übergabe fertigstellen.
Der Nutzer hat die Fortsetzung am 28.09.2026 ausdrücklich bestätigt.

## Paket 5 am 01.10.2026: eigene Vorlagen und Mediathek

Umsetzung im Branch `feat/builder-library`, Arbeitsverzeichnis
`../Funnelsoftware-builder`. Veröffentlichung und Freischaltung stehen für
diesen Abschnitt noch aus; der vorherige Produktionsstand folgt darunter.

- „Vorlagen & Medien“ im Editor: eigene Seiten und Abschnitte benennen,
  visuell auswählen, suchen, umbenennen, ersetzen, archivieren und wiederherstellen.
  Inhalte werden als unabhängige Kopie mit neuen internen IDs eingefügt;
  Änderungen an Vorlagen verändern keine bereits verwendeten Inhalte.
- Vor dem Einfügen Zielseiten, Antwortfelder und Auswahloptionen ausdrücklich
  zuordnen oder entfernen. Nur im selben Ursprungsfunnel werden noch gültige
  Verweise vorausgewählt. Entfernen verwirft betroffene Regeln vollständig
  und nutzt bei Textvariablen den Ersatztext. Standardziele bleiben erforderlich.
- Quelldesign nur in der Kopie behalten oder Zieldesign übernehmen, mit Vorschau
  und einem Undo-Schritt. Lokale Seiten-/Abschnittsstile verwenden Dokumentversion 5.
  Öffentliche Ausgabe, Vorschau und Canvas teilen die Darstellung; ältere
  Editoren bleiben schreibgeschützt. Einfügen während laufender A/B-Tests gesperrt.
- „Aus Mediathek“ an Bildfeldern sowie Verwaltung in der Bibliothek: neue Uploads
  erhalten private Metadaten, Suche, Ordner, Größenangaben und Archivierung.
  Verschieben/Umbenennen/Archivieren erhalten Datei und URL. Ältere Uploads
  werden weder einem Besitzer zugeordnet noch verändert oder gelöscht.
- Additive Migration `20261001_builder_library.sql`: drei neue nutzerbezogene
  Tabellen `content_templates`, `media_folders`, `media_assets`; keine bestehenden
  Inhalte umgeschrieben. Bibliothekszugriffe auf den eigenen Nutzer beschränkt,
  konkurrierende Änderungen mit Versionsprüfung. Keine globale Vorlagentabelle
  und kein implizites Team-Sharing. Audio bleibt im bisherigen Uploadpfad.
- Kopierhelfer erhält bei älteren Auswahlbedingungen und seitenweiten Zuordnungen
  auch die Verbindung zu den neuen Options-IDs. Abschnitts-Dragtest zielt jetzt
  auf den sichtbaren Griff statt in die Mitte der Steuerelemente.

Abnahme lokal: 469 Tests (411 Unit-/Komponententests und 58 Datenbank-/Migrationstests)
auf einem eigenen temporären PostgreSQL-Cluster, Loopback-Port 55439;
39 Browserabläufe, Typecheck einschließlich Server-/Shared-/Browsertests und
Produktionsbuild erfolgreich. Weitere 16 Browserprüfungen am Produktionsbuild
bestanden; sämtliche API-/externen Aufrufe dabei abgefangen.

Auslieferung: Erst kompatiblen Leser mit `BUILDER_LIBRARY_EDITOR=false` ausrollen,
Restore-Probe und wiederholte Migration im Deployment prüfen, Datenbank/Uploads
zusätzlich lokal sichern. Danach Live-Assets ausschließlich mit abgefangenen
API-/externen Aufrufen testen und die Fähigkeit aktivieren. Neue Uploads erhalten
nach der Migration schon bei deaktivierter Bibliotheksoberfläche Metadaten.
Nach ersten v5-Veröffentlichungen muss ein Code-Rollback den v5-Leser erhalten.

## Fortsetzung am 01.10.2026

### Personalisierung veröffentlicht und freigeschaltet

Veröffentlicht über [PR #179](https://github.com/Ds9001-1983/Funnelsoftware/pull/179).
Produktionsrelease: `dd6acded785ffd29e8552374425776e7af20f795`.
[Deployment 36823731418](https://github.com/Ds9001-1983/Funnelsoftware/actions/runs/36823731418)
einschließlich erneuter CI, Browser- und Datenbanktests erfolgreich. Health und
PM2 bestätigen den Release sowie `BUILDER_PERSONALIZATION_EDITOR=true`.
Die bisherigen Layout-/Routing-Fähigkeiten bleiben ebenfalls aktiv.

Arbeitsverzeichnis für die Fortsetzung: `../Funnelsoftware-builder`, lokaler
Dokumentationsbranch `docs/builder-personalization-rollout` auf `origin/main`.
Die beim Fortsetzen vorhandene Umsetzung wurde geprüft und ergänzt; diese
Abschlussnotiz ist lokal versioniert. Die Produktänderungen sind in `main`.

- „Persönliche Ansprache“ im Eigenschaftenbereich von Überschriften, Texten
  und Buttons: ausdrückliche Aktivierung, stabile Antwortquelle oder einzeln
  freigegebener URL-Parameter, Ersatztext und lokale Canvas-Testwerte.
- Alte Platzhalter bleiben wörtlich erhalten, bis sie ausdrücklich zugeordnet
  werden. Gespeichert bleibt der Vorlagentext; Inline-Bearbeitung erhält ihn
  auch bei eingeschalteter Testansicht. Testwerte lösen keinen Save aus.
- Gemeinsame Auflösung für flachen Canvas, Abschnitte, Funktionsvorschau und
  öffentliche Ausgabe; ausschließlich Text, begrenzte Länge, einmalige
  Ersetzung, keine dynamischen URLs oder Formularbeschriftungen.
- Antworten werden nur aus dem tatsächlich besuchten Weg gelesen. Die
  Aktivierung erklärt die bestehende moderne Zurück-/Pflichtfeldsemantik.
  Fehlende, verborgene und verlassene Quellen verwenden den Ersatztext.
- Neue Dokumentversion 4, Schreibschutz für ältere Editoren, serverseitige
  Publikationsprüfung, ID-Korrektur beim Kopieren und Schutz gegen das Löschen
  referenzierter Felder. Historische Lead-Antworten bleiben unverändert.
- Die neue Fähigkeit `BUILDER_PERSONALIZATION_EDITOR` ist standardmäßig aus.
  Der Leser arbeitet auch bei ausgeschalteter Bearbeitung. Keine neue
  Datenbankmigration; bestehende Inhalts- und Snapshot-Felder werden genutzt.
- Im Browser gefundene fehlende Aktualisierung der Canvas-Testwerte korrigiert:
  Der Memo-Vergleich berücksichtigt jetzt den Personalisierungskontext.
  Zusätzliche Tests decken Wertewechsel, Abschalten und Pfadänderung ab.
- Die erweiterte Browsersuite erreicht bestehende Abruf-/Versandlimits.
  Testhelfer beachten `Retry-After` und wiederholen über die echte Oberfläche;
  Produktionslimits bleiben unverändert.

Abnahme: **455 Tests bestanden**, davon 403 Unit-/Komponententests und 52
Datenbank-/Migrationstests (eigener temporärer PostgreSQL-Cluster auf Loopback,
Port 55438). Alle **33 Browserabläufe** bestanden. Typecheck einschließlich
Shared-, Server- und Browsertests sowie Produktionsbuild erfolgreich.
Zwölf Browserprüfungen am Produktionsbuild bestanden, einschließlich
v4-Schreibschutz, Abschnitts-Canvas, mobiler Vorschau und Personalisierung
ausschließlich in einer A/B-Alternative (beide Zuweisungen).

Sechs weitere Browserprüfungen gegen die ausgelieferten Live-Assets bestanden,
ohne JavaScript-Fehler. Alle API-/externen Aufrufe abgefangen; keine Testdaten
in Produktion. SHA-256 des JavaScript-Einstiegs `index-wWWi1_8k.js` entspricht
dem aktiven Serverrelease. Fähigkeiten-API ohne Anmeldung: 401. Erst danach
die Bearbeitung freigeschaltet und PM2/Health erneut geprüft.

Das Deployment erstellte ein frisches Backup; Restore und zweimaliger
Migrationslauf bestätigten unveränderte Inhalte aller 24 bestehenden Tabellen.
Datenbank und Uploads zusätzlich lokal gesichert, SHA-256 jeweils gegen die
Serverkopie geprüft:

- Lokal: `~/TrichterwerkBackups/releases/20261001T061739-dd6acded785f/`
- Server einschließlich Konfiguration:
  `/var/backups/funnelflow/releases/20261001T061739-dd6acded785f/`
- Konfiguration vor Freischaltung:
  `/var/backups/funnelflow/personalization-activation-20261001T061940/`

Das eigene temporäre PostgreSQL-Testcluster wurde beendet. Ab ersten
veröffentlichten v4-Inhalten muss ein Code-Rollback diesen Leser beibehalten;
Abschalten der Bearbeitung lässt die öffentliche Darstellung weiterarbeiten.

Editor neu laden, Überschrift/Text/Button auswählen und rechts unter
„Persönliche Ansprache“ aktivieren. Bestehende Funnels ändern sich erst nach
ausdrücklicher Zuordnung und Veröffentlichung.
Als nächstes offen: Paket 5, eigene Seiten-/Abschnittsvorlagen und Mediathek
aus der ursprünglichen Übergabe. Dazu noch keine Produktumsetzung begonnen.

## Fortsetzung am 30.09.2026

### Aktueller Stand: Besucherregeln veröffentlicht und freigeschaltet

Veröffentlicht über [PR #177](https://github.com/Ds9001-1983/Funnelsoftware/pull/177)
und die A/B-Ergänzung [PR #178](https://github.com/Ds9001-1983/Funnelsoftware/pull/178).
Aktueller Produktionsrelease: `3c8858abf318e623ff84c53072c2d76f9834c2a5`.
[Deployment 36729011007](https://github.com/Ds9001-1983/Funnelsoftware/actions/runs/36729011007)
einschließlich CI, Browser- und Datenbanktests erfolgreich. Der Health-Check
bestätigt den Release; PM2 läuft online mit `BUILDER_ROUTING_EDITOR=true` und
dem bisherigen `BUILDER_LAYOUT_EDITOR=true`.

Arbeitsverzeichnis für die Fortsetzung: `../Funnelsoftware-builder`, lokaler
Dokumentationsbranch `docs/builder-visitor-rollout` auf `origin/main`.
Diese Abschlussnotiz ist lokal versioniert; beide Umsetzungen sind in `main`.

Das Paket ergänzt die Flow-Ansicht um geordnete UND/ODER-Regeln, typisierte
Vergleiche mit Antworten früherer Seiten, ein Standardziel und einen Testmodus
mit Ziel und Begründung je Bedingung. Die Aktivierung zeigt die Übernahme alter
Weiterleitungen an, ist rückgängig machbar und wirkt erst nach Veröffentlichung.

- Neue Regeldokumente verwenden Version 3. Bestehende Regeln behalten ohne
  Aktivierung ihre Semantik; neue Auswahlfelder erhalten feste Options-IDs.
  Umbenennen ändert die Zuordnung nicht. Referenzierte Felder/Optionen können
  nicht versehentlich gelöscht werden. Seitenkopien erhalten neue Zuordnungen.
- Neue Besucherwege teilen sich Auswertung, Testmodus und Ablaufgrafik.
  Direkte Sprünge prüfen Pflichtfelder. Zurück folgt dem tatsächlich besuchten
  Weg und verwirft verlassene Antworten. Das passende Ergebnis erscheint erst
  nach erfolgreichem Absenden; paralleles/doppeltes Absenden wird verhindert.
- Veröffentlichung prüft Ziele, Quellen, vollständige Wege und Zyklen auch
  über gleichzeitig aktive A/B-Varianten. Bearbeitung der Regeln während
  laufender A/B-Tests ist gesperrt.
- Nullable `leads.answer_snapshot` speichert zusätzlich Feld-/Options-IDs,
  erfasste Texte, Pfad, Varianten und Inhaltsrevision. Altes `answers`,
  Webhooks und CSV bleiben erhalten; historische Antworten werden nicht
  rekonstruiert. Antwortstatistiken nutzen bei neuen Leads den Snapshot.
  Migration `20260930_visitor_answers.sql` ergänzt ausschließlich diese Spalte.
- Neuer Leser funktioniert mit ausgeschaltetem `BUILDER_ROUTING_EDITOR`;
  unbekannte/gesperrte Versionen bleiben im Editor schreibgeschützt. Leser mit
  ausgeschaltetem Flag geprüft, anschließend die Bearbeitung freigeschaltet.
  Sobald Version-3-Dokumente existieren, keinen älteren v1/v2-Leser zurückrollen;
  der aktuelle Release enthält zusätzlich die Korrektur für A/B-Auswahlfelder.

Abnahme: 442 Tests einschließlich 51 Datenbank-/Migrationstests, unveränderte
alte Routingtests, 26 Browserabläufe. Typecheck und Produktionsbuild erfolgreich.
Der Browsergesamtlauf respektiert die getrennten Wartezeiten beider bestehenden
Versandbegrenzungen; Produktionslimits bleiben unverändert.
Beide Deployments erstellten frische Backups. Restore und zweimaliger
Migrationslauf bestätigten jeweils unveränderte Inhalte aller bisherigen
Spalten der 24 Tabellen. Datenbank und Uploads zusätzlich lokal gesichert;
SHA-256 jeweils gegen die Serverkopie geprüft:

- `~/TrichterwerkBackups/releases/20260930T141911-62570f35fa92/`
- `~/TrichterwerkBackups/releases/20260930T142829-3c8858abf318/`

Serverkopien einschließlich Konfiguration liegen unter
`/var/backups/funnelflow/releases/` mit denselben Verzeichnisnamen.
Vor Freischaltung zusätzliches Konfigurationsbackup:
`/var/backups/funnelflow/visitor-rules-activation-20260930T142930/`.
Das eigene temporäre PostgreSQL-Testcluster wurde beendet.

Nachprüfung vor Freischaltung: Auch Auswahlfelder, die ausschließlich in einer
A/B-Alternative vorkommen, aktivieren den versionierten Besucherweg für den
gesamten Funnel. Öffentliche Ansicht und Vorschau berücksichtigen dafür die
Variantendefinitionen vor der Auswahl/Überlagerung. Zwei zusätzliche
Browserprüfungen bestätigen Snapshot, Options-ID und Variantenzuordnung für
Kontrolle und Alternative; ein Renderer-Test deckt die Vorschau ab.

Live-Abnahme: schreibgeschützter v3-Leser bei deaktivierter Fähigkeit,
Regelbearbeitung und Testmodus bei aktivierter Fähigkeit, mobile Vorschau,
öffentliche Verzweigung, besuchter Zurück-Pfad, verworfene Antworten,
Pflichtfelder bei direkten Sprüngen, fehlgeschlagenes Absenden mit erneutem
Versuch sowie Antwort-Snapshot einschließlich beider A/B-Fälle bestanden.
Alle API- und externen Browseraufrufe abgefangen; keine Testdaten in Produktion.
Keine JavaScript-Fehler. SHA-256 des ausgelieferten JavaScript-Einstiegs
`index-oJKlN1iz.js` entspricht dem aktiven Server-Release. Fähigkeiten-API ohne
Anmeldung: 401. PM2-Konfiguration und Health nach Freischaltung erneut geprüft.

Der vollständige PR-Prüflauf für #178 und der finale Deployment-Prüflauf sind
grün. Der redundante Push-Lauf 36728162760 hing bei der Chromium-Installation
und wurde nach erfolgreicher Prüfung desselben Commits im PR beendet.

Editor neu laden; unter „Flow-Ansicht“ die Regelseite auswählen und
„Besucherregeln aktivieren“. Einzelne Funnels bleiben bis zur ausdrücklichen
Aktivierung/Veröffentlichung bei ihrer bisherigen Semantik.
Als nächstes offen: Personalisierung, danach Vorlagen-/Medienverwaltung aus
der ursprünglichen Übergabe.

### Vorheriger Stand: Markenstile veröffentlicht

Das Paket ist über [PR #176](https://github.com/Ds9001-1983/Funnelsoftware/pull/176)
veröffentlicht. Aktueller Produktionsrelease:
`8f771a0bbe46be1154d7807f9cb8f537a6e4cef4`.
[Deployment 36675969933](https://github.com/Ds9001-1983/Funnelsoftware/actions/runs/36675969933)
einschließlich erneuter CI erfolgreich. Health-Check bestätigt diesen Release.

Arbeitsverzeichnis für die Fortsetzung: `../Funnelsoftware-builder`, lokaler
Dokumentationsbranch `docs/builder-brand-rollout` auf dem aktuellen `origin/main`.
Diese Abschlussnotiz ist lokal versioniert; die Umsetzung selbst ist in `main`.

- Designbereich mit vier abgestimmten Vorlagen, Farben, vorhandenen Schriften,
  Textgrößen, Button-Stilen, Rundungen und Elementabständen.
- Vorlagen vor dem Anwenden an der aktuellen Seite prüfen. Individuelle Werte
  bleiben standardmäßig erhalten. Optionales Zurücksetzen zeigt seinen Umfang
  und ist zusammen mit dem Designwechsel ein Undo-Schritt; bei laufenden
  A/B-Tests ist das Zurücksetzen gesperrt.
- Eigene Markenstile pro Benutzer speichern, wiederverwenden, umbenennen,
  ersetzen und archivieren. Versionsprüfung verhindert konkurrierendes
  Überschreiben. Jeder Funnel erhält eine unabhängige Kopie mit Herkunftsversion.
- Flache Editorvorschau an den gemeinsamen Design-Resolver und die öffentliche
  Darstellung angeglichen. Bestehende öffentliche Defaults bleiben erhalten;
  lokale Seiten- und Elementwerte haben weiterhin Vorrang.
- Additive Migration `20260930_brand_styles.sql` fügt nur die Vorlagentabelle
  und ihren Index hinzu. Keine bestehenden Funnel- oder Lead-Daten umschreiben.
  Die bereits aktivierte Fähigkeit `BUILDER_LAYOUT_EDITOR` schaltet auch die
  erweiterten Designfelder und die Markenstil-Bibliothek frei.

Abnahme: **427 Tests bestanden, keine übersprungen**, darunter alle 50
Datenbank-/Migrationstests in einem eigenen temporären PostgreSQL-Cluster.
Alle **23 Browser-Abläufe** bestanden; Markenstil-Ablauf nach den letzten
Vorschaukorrekturen erneut grün. Typecheck und Produktionsbuild erfolgreich.
Geprüft sind Vorschau/Abbrechen, Erhalt und Zurücksetzen individueller Werte,
Undo/Redo, Neuladen, Wiederverwendung, fremde Kontozugriffe, Versionskonflikte
und unabhängige Veröffentlichung nach Änderung/Archivierung einer Vorlage.

Produktionsprüfung: Designbereich mit Bibliothek und Vorschau/Abbrechen sowie
mobile Funktionsvorschau und öffentliche Ausgabe mit den echten Live-Assets
geprüft, ohne JavaScript-Fehler. Alle API- und externen Browseraufrufe abgefangen;
keine Test-Leads oder Test-Funnels auf Produktion angelegt. SHA-256 des
ausgelieferten JavaScript-Einstiegs entspricht dem aktiven Server-Release.
Markenstil-API ohne Anmeldung antwortet mit 401.

Frisches Backup vor Migration erstellt, Restore und zwei Migrationsläufe
bestätigen unveränderte Inhalte aller 23 bisherigen Tabellen. Datenbank und
Uploads zusätzlich lokal unter
`~/TrichterwerkBackups/releases/20260930T060141-8f771a0bbe46/` gesichert;
SHA-256 beider Dateien gegen die Serverkopie geprüft. Serverbackup einschließlich
Konfiguration: `/var/backups/funnelflow/releases/20260930T060141-8f771a0bbe46/`.
Das eigene temporäre lokale PostgreSQL-Cluster wurde beendet.

Editor neu laden; eigene Markenstile stehen links im Reiter „Design“ bereit.
Als nächstes offen: Besucherregeln, danach Personalisierung sowie
Vorlagen-/Medienverwaltung aus der ursprünglichen Übergabe.

## Fortsetzung am 29.09.2026

### Aktueller Stand: ausgeliefert und freigeschaltet

Am 29.09.2026 wurden beide geprüften Pakete nacheinander ausgeliefert:

- [PR #174](https://github.com/Ds9001-1983/Funnelsoftware/pull/174):
  Editor-Grundlage, Release `cd5b9583bf8be10897463971129b88ad3fb7f38e`.
  [Deployment 36581854221](https://github.com/Ds9001-1983/Funnelsoftware/actions/runs/36581854221)
  erfolgreich.
- [PR #175](https://github.com/Ds9001-1983/Funnelsoftware/pull/175):
  Layouts und Abschnittsbearbeitung, aktueller Produktionsrelease
  `2055359d8a6b03218a4514e049576b0cc344bc15`.
  [Deployment 36582302537](https://github.com/Ds9001-1983/Funnelsoftware/actions/runs/36582302537)
  erfolgreich, einschließlich CI und Datenbank-/Browserprüfungen.
- Erst den kompatiblen Leser mit ausgeschalteter Bearbeitung geprüft;
  anschließend `BUILDER_LAYOUT_EDITOR=true` in der Produktionskonfiguration
  gesetzt, PM2 mit aktualisierter Umgebung neu gestartet und gespeichert.
  Prozessstatus, Release und aktives Flag bestätigt; öffentlicher Health-Check grün.
- Live-HTML und ausgelieferter JavaScript-Einstieg geprüft; dessen SHA-256
  stimmt mit dem aktuellen Server-Release überein. Nicht angemeldete Zugriffe
  auf die Editor-Fähigkeiten antworten mit 401.
- Sechs Browserprüfungen gegen die ausgelieferten Live-Assets bestanden,
  zusätzlich die aktive Editoransicht mit Abschnitten, Spalten und Vorlagen
  geprüft. Dafür ausschließlich synthetische Inhalte verwendet und alle
  API-/externen Aufrufe im Browser abgefangen. Keine Test-Leads oder Test-Funnels
  auf Produktion angelegt.
- Beide Deployments erstellten frische Backups. Restore und zweimaliger
  Migrationslauf ließen jeweils alle 23 bestehenden Tabellen der Restore-Kopie
  unverändert. Datenbank und Uploads zusätzlich lokal kopiert; SHA-256 jeweils
  mit der Serverkopie identisch.

Backups: `~/TrichterwerkBackups/releases/20260929T142217-cd5b9583bf8b/` und
`~/TrichterwerkBackups/releases/20260929T142600-2055359d8a6b/`.
Die entsprechenden Serverkopien liegen unter `/var/backups/funnelflow/releases/`;
die Konfiguration vor Freischaltung zusätzlich unter
`/var/backups/funnelflow/layout-enable-20260929T142743.environment`.

Für die nächste Fortsetzung: Arbeitsverzeichnis `../Funnelsoftware-builder`,
Dokumentationsbranch `docs/builder-layout-rollout` auf dem aktuellen `origin/main`.
Diese Auslieferungsnotiz ist lokal versioniert. Nächstes Umsetzungspaket sind
wiederverwendbare Designvorgaben und eigene Markenstile aus der ursprünglichen
Übergabe. Besucherregeln, Personalisierung sowie Vorlagen-/Medienverwaltung folgen.

Geöffnete Editoren einmal neu laden, damit die neue Fähigkeit abgefragt wird.
Bestandsseiten werden weiterhin nur auf ausdrücklichen Klick auf
„Abschnitte für diese Seite aktivieren“ umgestellt. Zum Abschalten der neuen
Bearbeitung das Flag auf `false` setzen und PM2 mit aktualisierter Umgebung neu
starten. Der kompatible Leser ab Release `2055359` bleibt die Mindestbasis für
Code-Rollbacks, sobald Version-2-Dokumente existieren.

### Umsetzung und Abnahme vor der Auslieferung

Arbeitsverzeichnis `../Funnelsoftware-builder`, Branch `feat/builder-layout-reader`,
aufbauend auf PR #174 (`feat/builder-editor-revisions`). Der folgende Stand ist
implementiert und lokal abgenommen; die Produktion wurde nicht verändert.

- Bestehende Seiten ausdrücklich auf Abschnitte umstellen; vorher den Entwurf
  als Revision sichern. Element-IDs, Feldzuordnungen und bisherige Antworten
  bleiben erhalten. Keine automatische Umstellung beim normalen Speichern.
- Abschnitte mit ein bis drei Spalten hinzufügen, verschieben, duplizieren und
  löschen; Elemente per Drag-and-drop, Auswahl oder Tastatur umplatzieren.
  Seitenbreite, Abschnittsfarbe, Innen- und Spaltenabstand bearbeiten.
- Leere Layouts und sechs Inhaltsvorlagen: Einstieg, Bild neben Text, Vorteile,
  Kundenstimmen, FAQ und Kontakt. Vorlagen erzeugen eigene IDs.
- Gemeinsame Spaltenstruktur in Editor, Vorschau und öffentlicher Ausgabe;
  mobile Stapelung richtet sich nach der tatsächlichen Inhaltsbreite.
- Gemeinsame Kopierhelfer für Seiten/Elemente: verschachtelte IDs und bekannte
  Verweise korrigieren, unbekannte Eigenschaften erhalten. Beim Reduzieren
  der Spalten gehen keine Inhalte verloren.
- Strukturänderungen bei laufenden A/B-Tests blockieren. Referenzierte Felder
  nicht unbemerkt löschen; ungültige Layouts oder Verknüpfungen vor dem
  Veröffentlichen serverseitig ablehnen. Änderungen bleiben rückgängig machbar.
- Version 2 beim Speichern und Wiederherstellen beibehalten; ältere Editoren
  erhalten Schreibschutz. Falsche Änderungs-/Wiederherstellungswarnungen durch
  die JSON-Schlüsselreihenfolge in PostgreSQL behoben.

Abnahme:

- **416 Tests bestanden**, einschließlich aller 46 Datenbank-/Migrationstests;
  keine übersprungenen Tests. Eigenes temporäres PostgreSQL-Cluster auf Loopback,
  getrennt von vorhandenen lokalen Diensten und der Produktion.
- **22 Browser-Abläufe bestanden**: Drag-and-drop von Elementen und Abschnitten,
  Undo/Redo, Neuladen ohne falsche Sicherungswarnung, getrennte Entwurf-/Live-
  Stände, Pflichtfelder, Lead-Erfassung und Wiederherstellung mit Erhalt des
  später eingegangenen Leads. Bestehende A/B-, Recruiting- und Trackingtests grün.
- Zusätzlich **6 Browserprüfungen am Produktions-Build** bestanden.
- `npm run check:all`, zusätzlicher Typecheck der Shared-/Server-/Browsertests
  und `npm run build` erfolgreich. Desktop-Oberfläche per Screenshot geprüft.
- CI aktiviert die Abschnittsbearbeitung in ihrer isolierten E2E-Umgebung.

Freischaltung und weitere Arbeit:

1. PR #174 zuerst integrieren; anschließend dieses Paket mit
   `BUILDER_LAYOUT_EDITOR=false` ausliefern. Der Standard bleibt deaktiviert.
2. Erst nach Auslieferung und Prüfung des kompatiblen Lesers
   `BUILDER_LAYOUT_EDITOR=true` setzen. Ohne die Fähigkeit zeigt der Editor
   Version-2-Dokumente als schreibgeschützte Funktionsvorschau.
3. Nach ersten Version-2-Veröffentlichungen für Code-Rollbacks mindestens
   diesen kompatiblen Leser verwenden. Abschalten der Bearbeitung verändert
   weder Inhalte noch die Darstellung bereits veröffentlichter Layouts.
4. Eigene Markenstile, erweiterte Besucherregeln, Personalisierung und
   Vorlagen-/Medienverwaltung sind weitere noch offene Umsetzungspakete.

### Vorheriger Zwischenstand: kompatibler Leser

### Arbeitsstand

Arbeitsverzeichnis: `../Funnelsoftware-builder`, Branch
`feat/builder-layout-reader`, Basis `05c7a4e`.
Die bereits begonnenen Änderungen an Schema, Layout-Helfern und Speicherung
wurden in dieser Sitzung ergänzt. Der Stand ist lokal, noch nicht committed,
gepusht oder veröffentlicht. Keine Migration und kein Produktionszugriff.

Die ältere Planungsdatei `../Funnelsoftware/UEBERGABE-PRODUKTENTWICKLUNG.md`
beschreibt den Stand vom 21.09.2026. Ihre Aussage „keine Umsetzung“ ist als
historischer Stand zu lesen: Die Revisionsgrundlage ist inzwischen über
PR #173 in `main`; die Editor-Integration liegt in PR #174, auf der dieser
Branch aufbaut. PR #174 war bei der Prüfung offen und hatte grüne CI-Prüfungen.

### In diesem Schritt umgesetzt

- Dokumente der Versionen 1 und 2 lesen; unbekannte Versionen ablehnen.
  Bestehende flache Inhalte bleiben Version 1. Neue Layout-/Designdaten
  erfordern Version 2; Wiederherstellung und Kopien erhalten diese Kennzeichnung.
- Layouts referenzieren die vorhandenen Element-IDs. Inhalte und Formulardaten
  bleiben in `pages[].elements`; alte `sections` werden nicht automatisch
  zusammengeführt oder umgeschrieben.
- Gemeinsame Spaltendarstellung für öffentliche Ausgabe und Funktionsvorschau:
  ein bis drei Spalten, Abschnittsfarben, Abstände und Seitenbreiten. Unter
  640 px Inhaltsbreite stapeln Spalten über CSS-Container-Abfragen, auch
  innerhalb einer schmalen Vorschau auf einem großen Bildschirm.
- Erste Designvorgaben für Textgrößen, Abstände, Button-Stile und Rundungen.
  Element-Überschreibungen gehen vor; das bisherige Design bleibt ohne neue
  Vorgaben erhalten. Dies ist noch kein vollständiger Markenstil-Editor.
- A/B-Inhalte und Layout gemeinsam übernehmen; Kontrollvarianten bleiben
  unverändert. Vor Veröffentlichung fehlende/doppelte Elementverweise und
  ID-Kollisionen aktiver Varianten prüfen. Fehlerhafte Entwürfe bleiben in
  der Vorschau mit sämtlichen flachen Elementen sichtbar.
- Schreibzugriffe älterer Editoren auf neue Dokumente sowie Wiederherstellung
  nicht unterstützter Versionen blockieren. Der derzeitige Editor zeigt neue
  Layout-Dokumente als durchspielbare Vorschau, ohne Schreibwarteschlange.
  Lokale Sicherungen bleiben erhalten; Sicherungskopien und Downloads
  behalten ihre Dokumentversion.
- Einen Absturz bei alten gespeicherten `abTests: null` behoben. Die öffentliche
  Inhaltsversion stammt nun aus dem Live-Snapshot, nicht aus dem neueren Entwurf.

### Prüfung

- `npm run test:run`: **358 bestanden, 45 übersprungen**. Die übersprungenen
  Tests benötigen eine ausdrücklich konfigurierte isolierte Datenbank.
- `npm run check:all`: erfolgreich. Neue Shared-/Server-/Browser-Testdateien
  zusätzlich mit TypeScript geprüft, weil die bestehende Test-Konfiguration
  nur Client-Tests einbezieht.
- `npm run build`: erfolgreich.
- `npx playwright test --config playwright.preview.config.ts`:
  **6 bestanden**. Öffentliche Ausgabe und Owner-Vorschau bei 1440/390 px,
  schmale Vorschau im großen Fenster, Eingabereihenfolge, kein horizontaler
  Überlauf sowie schreibgeschützter Editor. API und externe Aufrufe abgefangen.
  Voraussetzung für diesen eigenständigen Browserlauf ist ein aktueller Build;
  sein Server liefert ausschließlich statische Dateien aus.
- Neue Unit-Tests prüfen Pflichtfelder und Lead-Payload beider Spalten,
  Referenzen, A/B-Kompatibilität sowie Versions-/Wiederherstellungsschutz.
  Die neuen Server-Tests verwenden ein Datenbank-Mock und belegen keine
  reale Transaktions- oder Produktionsmigration.

### Nächster Schritt

Zunächst diesen kompatiblen Leser prüfen und nach PR #174 integrieren. Die
Schreibversion des Editors bleibt in dieser Stufe bewusst auf 1. Vor Aktivierung
neuer Layout-Bearbeitung muss dieser Leser ausgeliefert sein; ein Rollback auf
einen älteren Leser kann bereits veröffentlichte Version-2-Funnels nicht lesen.

Danach Abschnittsbearbeitung im Desktop-Editor anbinden: Einfügen, Verschieben,
Duplizieren, Löschen, ID-/Referenzkorrektur, gemeinsame Canvas-Darstellung und
erste Abschnittsvorlagen. Normalen Save, Undo/Redo und A/B-Varianten dabei
vollständig prüfen, anschließend Speicherung/Veröffentlichung/Wiederherstellung
in der isolierten Datenbank-E2E-Umgebung abnehmen. Keine automatische Umstellung
vorhandener Funnels. Eigene Markenstile, erweiterte Besucherregeln,
Personalisierung und Mediathek bleiben weitere Pakete des ursprünglichen Plans.

## Vorheriger Stand vom 28.09.2026

### Veröffentlicht

- Recruiting und Landingpage: [PR #172](https://github.com/Ds9001-1983/Funnelsoftware/pull/172),
  Produktion `1348cd61f571f339f8f6d0e9a2e619574de4a595`.
- Deployment 36426511339 erfolgreich; Live-Health mit Commit, nginx-Assets,
  aktualisierter Vergleich und Login-Grenzen nach Veröffentlichung geprüft.
- SMTP-Verbindung und Anmeldung geprüft, keine Testmail an echte Empfänger.
- Datenbank/Uploads lokal zusätzlich gesichert unter
  `~/TrichterwerkBackups/releases/20260928T131051-1348cd61f571/`;
  SHA-256 mit Serverkopie identisch. Neue Versandwarteschlange bei Abnahme leer.

- Kompatible Revisionsgrundlage: [PR #173](https://github.com/Ds9001-1983/Funnelsoftware/pull/173),
  Produktion `94b7b7d1706766691cca5102a732ef83740b2d4e`, Deployment 36429672059 erfolgreich.

### Laufender Abschnitt: Editor mit Entwurfsschutz

Die Servergrundlage unterstützt bereits beide Speicherprotokolle:

- Alte Funnels behalten ihr bisheriges Verhalten, solange sie ausschließlich
  mit dem bisherigen Editor bearbeitet werden. Auch diese Schreibvorgänge
  erzeugen nun eine unveränderliche Inhaltsrevision.
- Die nächste Editoroberfläche sendet `documentVersion`, `expectedVersion` und
  `mutationId`. Der erste solche Schreibvorgang schaltet `editorProtocol` dauerhaft
  ein. Ab dann werden alte Schreibzugriffe abgelehnt; ein Save verändert nur den
  Entwurf, `publish: true` veröffentlicht atomar den angegebenen Stand.
- Erst diese kompatible Servergrundlage ausrollen, danach die Oberfläche.
  Dadurch kann ein Code-Rollback der neuen Oberfläche weiter den korrekten
  Live-Stand lesen. Nicht auf einen Code zurückgehen, der Revisionen nicht kennt,
  nachdem moderne Entwürfe aktiviert wurden.
- Wiederherstellen erzeugt einen neuen Entwurf und pausiert dort zuvor laufende
  A/B-Tests. Leads, Antworten, Analysedaten, Eigentümer, Domains und private
  Integrationseinstellungen werden nicht zurückgesetzt.
- Tracking-IDs und private Integrationseinstellungen bleiben aktuelle
  Betriebseinstellungen; sie sind kein Bestandteil von Inhaltsrevisionen.
- Veröffentlichung, öffentliche API, eigene Domain und HTML-Metadaten verwenden
  denselben veröffentlichten Inhalt. Vorschau und Editor lesen den Entwurf.
- Eine DB-Sperre und ein Protokoll-Trigger schützen den Übergang bei der Migration;
  Lead-/View-Zähler, Downgrades und Soft-Delete bleiben möglich.

Die Migration ergänzt Felder und eine Tabelle; bestehende Seiten-/Element-IDs,
Inhalte, URLs und Nutzerdaten werden nicht umgeschrieben. Es gibt keine
automatische Löschung von Revisionen.

Geprüft: TypeScript und Produktions-Build, 373 erfolgreiche Tests, bestehende
13 E2E-Abläufe, sechs gezielte
DB-Tests für Revisionen, Migrationstest und zusätzlicher HTTP-E2E für
Entwurf/Live, Domain-Auflösung, Wiederholung nach verloren gegangener Antwort,
Wiederherstellung mit später eingegangenen Leads und alte Editor-Tabs.
Restore-Probe einer aktuellen Produktionskopie erfolgreich: Beide Migrationsläufe
ließen alle 22 bestehenden Tabellen in ihren bisherigen Spalten unverändert.

### Noch zu erledigen

1. Servergrundlage mit Restore-Probe, CI und Live-Health abgeschlossen.
2. Editor umgesetzt, lokale Abnahme läuft: gemeinsame Schreibwarteschlange,
   ausdrückliche Veröffentlichung, paginierte Revisionsübersicht/Wiederherstellung,
   Konfliktanzeige mit Kopie/Download, nutzerbezogene lokale Inhaltssicherung ohne
   Integrationsgeheimnisse. Navigation wartet auf das Speichern, Vorschau öffnet
   den Entwurf. Änderungen während des Speicherns bleiben ungespeichert markiert.
   Neue Queue-/Hook-Tests und vollständiger UI-Test einschließlich Konfliktkopie
   bestanden. Gesamtabnahme: 378 Tests, 15 E2E-Abläufe, TypeScript und Build grün.
   Noch CI und Veröffentlichung abschließen.
3. Gemeinsamer versionierter Dokumentzugriff und ID-/Referenzhelfer.
4. Abschnitte/Layouts und gemeinsamer responsiver Renderer, bestehende Formulare
   und Antworten erhalten. Bearbeitung bleibt Desktop/Laptop.
5. Wiederverwendbare Designvorgaben/Markenstile.
6. Erweiterte Besucherregeln mit UND/ODER, Prioritäten, Standardziel und Testmodus.
7. Personalisierung aus Antworten und erlaubten Kampagnenparametern mit Ersatztext.
8. Eigene Vorlagen und Mediathek mit Eigentümergrenzen, stabilen URLs und
   Archivierung. Bestehende unzugeordnete Uploads weder umdeuten noch löschen.

Die Detailgrundlage bleibt die unveränderte Übergabedatei im ursprünglichen
Arbeitsverzeichnis `Funnelsoftware/UEBERGABE-PRODUKTENTWICKLUNG.md`.
