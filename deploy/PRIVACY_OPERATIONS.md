# Kundenanfragen, Vertragsnachweise und Datenschutzvorfälle

Stand: 09.11.2026. Betriebsentwurf zu R07 und PR #183. Die Abläufe und Vorlagen
sind vorbereitet; ihre regelmäßige betriebliche Durchführung ist noch nicht
nachgewiesen. Keine Kundennachricht wird durch dieses Dokument versendet.

## Zuständigkeit und private Ablage

Verantwortlich für die Bearbeitung: Dennis Sasse. Eine erreichbare Vertretung
und die Abdeckung von Abwesenheiten sind noch zu benennen. Eingang ist die
bereits veröffentlichte Kontaktadresse `info@superbrand.marketing`.
Postfachkontrolle, Fristenkontrolle und Vorfall-Erreichbarkeit müssen tatsächlich
organisiert werden; die Anwendung enthält dafür kein automatisches Fallmanagement.

Ausgefüllte Unterlagen gehören in eine zugriffsbeschränkte Betriebsablage außerhalb
des Git-Repositories. Das Repository enthält nur leere Vorlagen und synthetische
Prüffälle. Keine Kundendaten, Ausweiskopien, Exporte, Vertragsexemplare oder
Zugangsdaten in Git, öffentliche Tickets oder PR-Kommentare übernehmen.

Je Fall eine neutrale Kennung, etwa `ANFRAGE-2026-001`, und eine Kopie der
[Fallvorlage](privacy-templates/case.md) anlegen. Ein privater Index enthält nur
Kennung, Fallart, Bearbeiter, Status, Eingang, Frist und nächste Aktion; die
Zuordnung zur Person liegt im geschützten Fallordner. Originalnachrichten und
Belege erhalten; Berichtigungen mit Datum ergänzen. Vor Weitergabe Empfänger und
Übertragungsweg prüfen, personenbezogene Exporte nicht öffentlich verlinken.

Für jeden Fall Zweck, notwendige Nachweisbestandteile, Prüftermin und gegebenenfalls
gesetzliche Aufbewahrung bestimmen. Arbeitskopien nach Wegfall ihres Zwecks
entfernen. Es wird keine neue pauschale Aufbewahrungsfrist für Fallakten festgelegt.

## 1. Eingang, Einordnung und Fristen

1. Eingang mit Zeitzone, Anfrage und gewünschtem Ergebnis festhalten. Eine
   mögliche Datenschutzverletzung sofort nach Abschnitt 4 behandeln.
2. Rolle bestimmen: Eigene Konto-/Vertragsdaten bearbeitet Trichterwerk als
   Verantwortlicher. Bei Lead-/Bewerberdaten ist regelmäßig der Funnelbetreiber
   zuständig; Anfrage unverzüglich an den festgestellten Auftraggeber weiterleiten
   und ihn unterstützen. Bei Agenturen die Weisungskette klären.
3. Identität und gegebenenfalls Vertretungsbefugnis angemessen prüfen. Bestehende
   authentifizierte Kontaktwege nutzen; Ausweiskopien nicht standardmäßig verlangen.
   Bei begründeten Zweifeln nur erforderliche Zusatzinformationen anfordern.
   Eine unbekannte Absenderadresse erlaubt keine Offenlegung von Kundenzuordnungen.
4. Umfang, zuständige Person, Antwortfrist und nächste Aktion in der Fallakte
   festhalten. Die Monatsfrist des Art. 12 Abs. 3 DSGVO ist kein pauschaler
   30-Tage-Zähler. Eine nötige Verlängerung muss begründet und innerhalb des ersten
   Monats mitgeteilt werden. Eine Rückfrage wird nicht ohne Prüfung als Neustart
   oder Aussetzung der Frist behandelt.
5. Kurze Eingangsbestätigung vorbereiten. Sie bestätigt nur den Eingang und
   gegebenenfalls die Weiterleitung, nicht schon Identitätsprüfung oder Erledigung.

Rechtlicher Bezug: [BfDI zur Identitätsprüfung und Frist nach Art. 12 DSGVO](https://www.bfdi.bund.de/SharedDocs/Downloads/DE/DokumenteBfDI/Rundschreiben/Allgemein/2024/Rundschreiben-Erfahrungsaustausch-bDSB-KK-PfK.pdf?__blob=publicationFile&v=3).
Die konkreten Zuständigkeiten und Arbeitsschritte oben sind der Betriebsentwurf.

## 2. Auskunft, Rückgabe und Löschung

Für jeden angefragten Bereich Ergebnis und Beleg separat erfassen:

| Bereich | Arbeitsweg | Grenze / Abschlussbeleg |
| --- | --- | --- |
| Lead-/Bewerbungsdaten | Berechtigter Kontoinhaber: Leads → DSGVO → E-Mail suchen → Exportieren | [Betroffenenauskunft](SUBJECT_ACCESS.md); weitere Adressen/Suchmerkmale und Angaben zu Dritten prüfen. |
| Recruiting | Export auf Verläufe, Mailinhalt und Empfänger prüfen | Frühere Empfänger können Treffer liefern, ohne dass die aktuelle Lead-Adresse passt. |
| Kundenbereiche, Konto, Medien | Umfang über Eigentümer und konkrete Ressourcen ermitteln | Kein ungeprüfter kontoübergreifender Export; Betroffenenauskunft ersetzt keinen vollständigen Kontoexport. |
| Support und Postfächer | Anwendungsanhänge und betroffene Postfachkopien getrennt prüfen | App-Bereinigung entfernt bereits versandte E-Mail-Kopien nicht. |
| Externe Empfänger | Aktivierte Integrationen und tatsächlich versandte Daten klären | Zuständige Empfänger, veranlasste Schritte und Rückmeldungen dokumentieren. |
| Sicherungen | [Backup-Aufbewahrung](BACKUP_AUTOMATION.md), Schutzfälle und Journal berücksichtigen | Kein Versprechen, dass alle Sicherungskopien sofort gelöscht sind. |

**Auskunft/Rückgabe:** Export zuerst intern auf Vollständigkeit, richtigen
Verantwortlichen und Daten anderer Personen prüfen. Erforderliche ergänzende
Auskunftsinformationen zusammenstellen. Ein JSON-Export allein erledigt nicht jede
Auskunftspflicht. Den geprüften Umfang über einen mit dem berechtigten Empfänger
abgestimmten geschützten Weg übermitteln; Zeitpunkt und Übergabebeleg festhalten.
Ein vollständiger Anbieterwechsel bleibt das gesonderte Paket R15.

**Löschung:** Zuerst berechtigte Weisung, betroffene Ressourcen und begründete
Ausnahmen klären; eine gewünschte Rückgabe vor Kontolöschung abschließen. Dann
die vorhandene Oberfläche bzw. dokumentierte Funktion verwenden. Keine direkte
SQL-Löschung, keine Abschaltung des Journals und keine Umgehung der Bestätigung.

- [Lead-Löschung](MANUAL_LEAD_ERASURE.md): `202 / queued` bedeutet verbindlich
  beauftragt. `queuedCount` ist keine Zahl bereits gelöschter Datensätze. Die
  E-Mail-Löschung umfasst die aktuell passende Lead-Adresse; nur über frühere
  Mailempfänger gefundene Inhalte gesondert behandeln.
- [Kontolöschung](ACCOUNT_ERASURE.md): Konto wird gesperrt, Ausführung wartet auf
  externe Bestätigung und erforderlichen Abrechnungsabschluss. Öffentliche
  Upload-URLs können bis zur tatsächlichen Dateilöschung erreichbar bleiben.
- Bei Wartezustand Auftrag, Zeitpunkt und betroffene stabile Kennungen festhalten.
  Nach externer Bestätigung den tatsächlichen Löschabschluss kontrollieren.
  Nicht allein aus Journaldatei oder Datenbankquittung auf Ausführung schließen.
- Bei Fehler, Teilabschluss oder ausbleibender Bestätigung bleibt der Fall offen;
  nächste Kontrolle und Betriebsverantwortlichen festhalten. Kein fester
  Fünf-Minuten-Abschluss versprechen: Der externe Sicherungsrechner kann offline sein.
- Abschlussantwort unterscheidet erledigte Anwendungsdaten, noch offene
  Empfängerkopien und verbleibende begründete Sicherungs-/Aufbewahrungsfälle.
  `0 Treffer` ist nur das Ergebnis der konkreten Suche, kein Nachweis für alle Systeme.

Vor einer Wiederherstellung gilt [ERASURE_RESTORE.md](ERASURE_RESTORE.md): aktueller
Quellenvergleich und vollständiger Offline-Replay vor öffentlicher Freigabe.
Die Fallakte ergänzt das technische Journal und ersetzt es nicht.

## 3. Bestandsverträge und dokumentierte Annahme

Die neue Registrierung aus PR #183 gilt erst nach ihrer Veröffentlichung für neue
Registrierungen. Bestandskunden werden durch Migration oder neue Webseite nicht
rückwirkend gebunden. Die Vertragsfassung `2026-11-09` ist derzeit ein Entwurf.

1. Pro betroffenem Vertragspartner vorhandene Vereinbarung, zugehöriges Konto,
   vertretungsberechtigte Kontaktperson und verfügbare Nachweise ermitteln. Eine
   fehlende `registration_contract`-Spalte bzw. ein leerer Wert beweist nicht,
   dass außerhalb der Anwendung kein Vertrag existiert.
2. Festlegen, ob eine Ergänzung oder neue Vereinbarung angeboten werden muss.
   Bestehende Preise, Laufzeiten und individuelle Zusagen ausdrücklich prüfen.
   Unklare Fälle fachlich klären, bevor Änderungen behauptet oder versandt werden.
3. Für das konkrete Angebot unveränderliche AGB-/AVV-Dateien, Fassungskennung,
   SHA-256 und verständliche Änderungsübersicht zusammenstellen. Vor Veröffentlichung
   keine derzeit noch nicht erreichbaren API-Links als verfügbare Downloads versenden.
4. Entwurf der Nachricht aus der [Annahmevorlage](privacy-templates/contract-acceptance.md)
   ausfüllen. Zustellung und bewusste Annahme getrennt protokollieren. Schweigen,
   Login, weitere Nutzung und ein gesetztes Datenbankfeld gelten in diesem Ablauf
   nicht als ausdrückliche Annahme. Keine automatische Preiserhöhung oder Sperre.
5. Antwort mit Identität/Vertretung, bezogener Fassung, Erklärungsinhalt, tatsächlichem
   Zeitpunkt und vereinbartem Wirksamkeitsdatum aufbewahren. Fehlende Angaben klären.
   Die Anwendung besitzt derzeit keinen nachträglichen Annahmedialog.
6. Externen Annahmenachweis privat mit Konto/Vertrag verknüpfen; das ursprüngliche
   Registrierungsfeld niemals umschreiben. Altvertrag und etwaige Nachträge erhalten.
   Bei Ablehnung oder ausbleibender Antwort weiteren Umgang gesondert entscheiden.

Die Einführung dieses Verfahrens verlangt weder Versand an alle Konten noch eine
pauschale Neuerteilung aller Verträge. Umfang anhand der vorhandenen Vereinbarungen
bestimmen. Es wurde in dieser Fortsetzung niemand angeschrieben.

## 4. Sicherheitsvorfälle

Die [Vorfallvorlage](privacy-templates/incident.md) verwenden. Bekanntwerden mit
Zeitzone dokumentieren, weitere Offenlegung begrenzen und verfügbare Belege sichern.
Betroffene Systeme, Datenarten, Personenkreise, Zeitfenster und Unsicherheiten trennen.
Keine Geheimnisse oder vollständigen Datensätze in allgemeine Logs übernehmen.

Bei Auftragsdaten den festgestellten Auftraggeber unverzüglich über gesicherte
Kontaktwege informieren; nicht auf die vollständige Untersuchung warten.
Bei eigener Verantwortlichkeit Risiko und Meldepflicht prüfen: Meldung an die
zuständige Aufsicht unverzüglich und möglichst binnen 72 Stunden, sofern die
Voraussetzungen vorliegen. Diese Frist ist keine Wartefrist für die Information
des Auftraggebers. Unvollständige Erkenntnisse nachmelden; Entscheidung und Gründe
auch bei unterbleibender Meldung dokumentieren. Zuständige Aufsicht je Fall
feststellen; die unten verlinkte Quelle bestimmt nicht automatisch die Zuständigkeit.

Rechtlicher Bezug: [LfD Niedersachsen zu Art. 33 DSGVO](https://www.lfd.niedersachsen.de/verletzung).
Betroffeneninformation, weitere Maßnahmen und Wiederinbetriebnahme gesondert
prüfen und dokumentieren. Eine bloße technische Fehlerbehebung schließt den Fall nicht.

## 5. Dienstleisteränderungen und Einführung

Für einen neuen oder ersetzten Dienstleister zuerst die
[Nachweisprüfung](SUPPLIER_EVIDENCE.md) und das angekündigte Verfahren im
[R07-Vertragsabgleich](../R07-VERTRAGSABGLEICH.md) verwenden. Die dort vorgesehenen
30 Kalendertage sind Teil des Vertragsentwurfs, keine hier behauptete allgemeine
gesetzliche Standardfrist. Je Kunde ist die tatsächlich geltende Vereinbarung
maßgeblich; offene Widersprüche und Rückläufer gesondert behandeln.

Vor betrieblicher Einführung folgende Angaben mit echtem Datum festhalten:

- Bearbeiter, erreichbare Vertretung und tatsächliche Eingangs-/Fristenkontrolle.
- Private Ablage, Zugriffsberechtigte, sicherer Übergabeweg und Prüfung von Arbeitskopien.
- Verfügbare Vertragsanlagen, abgeschlossener Abgleich und verbleibende Abweichungen.
- Erprobung eines Falles, festgestellte Lücken, Zuständigkeit und Termin zur Behebung.

Derzeitiger Nachweisstand: Dokumentation und synthetische Schreibtischprüfung
vorhanden; Vertretung, laufende Kontrolle und echte Fallbearbeitung nicht nachgewiesen.
Ein zukünftiger Betreibervermerk über die Einführung muss Datum und konkreten
Umfang nennen. Die Erstellung dieser Datei ist kein solcher Vermerk.
