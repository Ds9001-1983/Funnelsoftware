# Vertragsabgleich R07

Stand: 9. November 2026. Ergänzung zu PR #183; neue Vertragsfassung `2026-11-09`. Die Fassungen `2026-10-12` und `2026-10-14` bleiben unverändert archiviert. Abgleich mit Main `58c5dcb` und den dokumentierten Live-Abnahmen von R10/R11/R12. Dieses Dokument unterscheidet Vertragspflichten, nachgewiesene technische Eigenschaften und noch nicht nachgewiesene Betriebsabläufe. Es ist keine abschließende juristische Bewertung aller Klauseln.

## Ergebnis des Abgleichs

Die AVV beschreibt jetzt Lead- und Bewerberdaten, Statusverläufe, gespeicherte E-Mail-Inhalte und Versandaufträge, Einladungen und Zugriffe in Kundenbereichen sowie Medien und Supportdaten. Bei Agenturen wird zwischen Verantwortlichem und weiterem Auftragsverarbeiter unterschieden; eine technische Kundenbereichsrolle legt die rechtliche Rolle nicht fest.

Hetzner und Alfahosting stehen als von Trichterwerk beauftragte weitere Auftragsverarbeiter in der Liste. Dennis Sasse hat im Chat den Abschluss beider AV-Verträge bestätigt („Beide abgeschlossen“). Diese Betreiberbestätigung ist dokumentiert; die unterzeichneten Fassungen, Leistungsanlagen und TOM-Anlagen wurden nicht eingesehen. Die Verträge sind deshalb nicht länger als „Abschluss unbekannt“ einzustufen, ihre konkrete Reichweite ist noch nicht dokumentenbasiert geprüft.

Stripe wird beim eigenen Abrechnungsfluss eingeordnet. Die kundenseitig ausgewählten Integrationen und BYOK-KI-Anbieter werden getrennt beschrieben. Eine pauschale Rollen- oder DPF-Zusage für sämtliche Verarbeitungsvorgänge entfällt. Das entspricht auch der Differenzierung im aktuellen [Stripe-Datenschutzvertrag, Abschnitt 2](https://stripe.com/legal/dpa), der je nach Verarbeitung unterschiedliche Rollen beschreibt. Die Einordnung unseres konkreten Datenflusses beruht zusätzlich auf dem Anwendungscode.

In den AGB benötigen Änderungen bestehender Abopreise eine ausdrückliche Zustimmung. Der zusätzliche pauschale Ausschluss mittelbarer Schäden widerspricht nicht mehr der Haftung für wesentliche Vertragspflichten. Bei unwirksamen Klauseln gilt die gesetzliche Regelung, keine automatische Ersetzung durch den wirtschaftlich nächstliegenden Text. Grundlage der redaktionellen Prüfung sind [§ 307 BGB](https://www.gesetze-im-internet.de/bgb/__307.html) und [§ 306 BGB](https://www.gesetze-im-internet.de/bgb/__306.html). Daraus wird keine abschließende Wirksamkeitsfeststellung für sämtliche AGB abgeleitet.

Die Anforderungen an konkrete Verarbeitungsbeschreibungen, TOMs und Unterauftragsverhältnisse sind anhand der [FAQ des LfD Niedersachsen zu Art. 28 DSGVO](https://www.lfd.niedersachsen.de/faq/faq-auftragsverarbeitung-nach-artikel-28-dsgvo-189637.html) und der dort erläuterten gesetzlichen Pflichten abgeglichen. Eine allgemeine Nennung von Art. 32 ersetzt danach keine bewertbare Beschreibung der Sicherheitsmaßnahmen. Die neue Fassung enthält deshalb konkrete Maßnahmen und macht Grenzen erkennbar.

## Nachweise und Grenzen

| Gegenstand | Beleg | Bewertung |
| --- | --- | --- |
| Recruiting-Verlauf und Bewerbermails | `shared/schema.ts`, `server/recruiting.ts`, `server/recruiting-mail.ts`, `server/email.ts` | Status mit Benutzer/Zeit/Version; Nachrichteninhalt und Versandmetadaten gespeichert. In der AVV ergänzt. |
| Kundenbereiche | `server/workspaces.ts`, `server/workspace-routes.ts` | Bestätigte Konto-E-Mail und angenommene Mitgliedschaft; Ressourcen auf zugeordnete Funnels beschränkt. Löschen des Bereichs löscht keine Leads. |
| Anmeldung und Sitzungen | `server/auth.ts`, `server/index.ts`, `server/storage.ts` | scrypt, Produktions-Cookie-Eigenschaften, Begrenzung von Anmeldeversuchen und serverseitige Berechtigungen im Code belegt. Keine Zusage von MFA oder lückenlosem Admin-Audit. |
| KI-Datenfluss | `server/ai.ts`, `server/crypto.ts` | Generierung sendet Beschreibung/Zielgruppe/Vorgaben; kein automatischer Zugriff auf Lead-Daten. AES-256-GCM schützt gespeicherte KI-Schlüssel, nicht pauschal alle Inhalte. |
| SMTP | `server/email.ts` | Empfänger, Nachrichtentext und bei Support Anhänge gehen an den Versanddienst. Keine Zusage einer Ende-zu-Ende-Verschlüsselung des E-Mail-Verkehrs. |
| Tägliche Sicherung | `scripts/backup-daily.sh`, `deploy/BACKUP_AUTOMATION.md` | Täglicher Ablauf um 03:00 UTC mit Datenbank, öffentlichen und privaten Uploads; getrennte Restore-Prüfung vor Bereitstellung. Betriebsabnahme im R11-Fortschritt dokumentiert; am 09.11. kein neuer Produktionszugriff. |
| Wiederherstellung bei Releases | `scripts/deploy-production.sh`, `deploy/ERASURE_RESTORE.md`; Release-Nachprüfung vom 06.11.2026 | Release `58c5dcb`: Restore und wiederholte Migration erhielten laut Deploymentprotokoll 35 Tabellen. Wiederherstellung verlangt aktuellen Journalabgleich und Replay. Keine Zusage eines vollständig geprüften Katastrophen-Wiederanlaufs. |
| Sicherungsfristen | `deploy/BACKUP_AUTOMATION.md`, Betreiberentscheidung vom 25.10.2026 | Tagespaare Server/Mac und Server-Releases: 30 Tage; Mac-Releases: 90 Tage. Geprüfte Wiederherstellungsreferenzen, neuere Sicherungen und dokumentierte Schutzfälle bleiben erhalten. Bei fehlendem externem Nachweis oder fehlgeschlagener Sicherheitsprüfung erfolgt keine Bereinigung. Kein Versprechen einer ausnahmslosen Höchstfrist. |
| Support-Aufbewahrung | `server/scheduler.ts` | Dateien nach 90, Meldungen nach 365 Tagen im täglichen Lauf. In Postfächern vorhandene Kopien sind davon nicht automatisch erfasst. |
| Kontolöschung und Dateien | `server/account-files.ts`, `server/erasure-journal.ts`, `server/auth.ts`, `server/storage.ts` | Zugeordnete öffentliche und private Dateien werden einbezogen. Löschauftrag wartet auf externe Bestätigung; Kontozugriff wird gesperrt. Unabhängiges Journal schützt gegen Wiederauftauchen bei Restore. Technischer R10-/R11-Umfang veröffentlicht; Postfach-/Empfängerkopien bleiben gesondert zu behandeln. |
| Rückgabe / Betroffenenrechte | `server/subject-export.ts`, `server/retention-routes.ts` | E-Mail-bezogene Auskunft umfasst passende Leads, Antworten, Einwilligungen, Recruiting-Verlauf und Mailinhalte, Aufbewahrungsausnahmen und Löschstatus, auch aus gelöschten Funnels und Free-Sperren. Kein vollständiger Konto-/Anbieterwechsel-Export: andere Suchmerkmale, Dateien, Kundenbereiche, Support und Empfängerkopien bleiben gesondert abzustimmen. |
| Kundengesteuerte Aufbewahrung | `server/retention.ts`, `server/analytics-retention.ts`, `server/retention-routes.ts` | Entwurf, lesende Vorschau und ausdrückliche Aktivierung sind getrennt. Kundenfristen ohne Standardaktivierung; Löschung wartet auf externe Sicherungsbestätigung. Plattformstatistik mit 90 Tagen ist ein separater Zweck und keine Standardfrist für Kunden-Leads. |
| Laufende organisatorische Maßnahmen | In diesem Paket vorbereitete Abläufe | Vertraulichkeitsnachweise, regelmäßige TOM-Überprüfung, Vorfallregister und Löschregister nicht durch Quellcode nachweisbar. Nicht als bereits eingeführt oder durchgeführt verbucht. |

## Vorbereiteter Ablauf für Änderungen weiterer Auftragsverarbeiter

Verantwortlich: Dennis Sasse beziehungsweise ausdrücklich benannte Betriebsvertretung. Dieser Ablauf ist manuell durchführbar; die Software versendet dafür keine automatische Nachricht. In dieser Bearbeitung wurde keine Nachricht an Kunden versandt und kein Dienstleister aktiviert.

1. Vor Beauftragung Zweck, Datenarten, Verarbeitungsorte, weitere Dienstleister, AVV und TOMs des Kandidaten dokumentieren; bei Drittlandbezug den konkreten Übermittlungsmechanismus prüfen.
2. Betroffene Vertragskunden bestimmen. Bei Agenturen den vertraglichen Auftraggeber anschreiben; Kundenbereichsmitglieder nicht ohne Prüfung als eigene Vertragskunden behandeln.
3. Mindestens 30 Kalendertage vor dem vorgesehenen Einsatz eine individualisierte Vertragsinformation an die hinterlegte Kontaktadresse senden. Empfänger, Vertragsversion, endgültigen Text, Versandzeit, Zustellstatus und etwaige Rückläufer protokollieren. Bei Rückläufern Kontakt klären und Einsatz für den betroffenen Kunden zurückstellen.
4. Widersprüche erfassen und vor Einsatz klären. Keine Auftragsdaten des widersprechenden Kunden übertragen, solange keine Lösung vorliegt. Ist technische Trennung nicht möglich, die Umstellung insgesamt zurückstellen oder die betroffene Leistung entsprechend dem Vertrag beenden.
5. Erst nach Fristablauf und Prüfung offener Fälle die Änderung durchführen. Dienstleisterliste und Nachweise aktualisieren; archivierte Vertragsfassungen nicht überschreiben. Den ursprünglichen Annahmenachweis nicht um eine fingierte Zustimmung ergänzen.

Vorlage für die zu vervollständigende Nachricht:

> Betreff: Trichterwerk – geplanter weiterer Auftragsverarbeiter ab [Datum]
>
> Für [Leistung] planen wir ab [Datum, mindestens 30 Kalendertage nach Ankündigung] den Einsatz von [vollständiges Unternehmen] [zusätzlich / anstelle von bisherigem Unternehmen]. Betroffen sind [Datenkategorien] aus [betroffene Funktionen]. Verarbeitet wird in [Länder]; die maßgeblichen Schutzmaßnahmen und gegebenenfalls Drittlandgarantien sind [konkrete Angaben und Nachweise].
>
> Sie können bis zum geplanten Einsatz am [Datum] aus datenschutzbezogenen Gründen per Antwort an info@superbrand.marketing widersprechen. Bitte nennen Sie die betroffene Leistung und Ihre Gründe. Bei einem begründeten Widerspruch klären wir mit Ihnen eine Lösung vor einer Übermittlung Ihrer Auftragsdaten an den neuen Dienstleister. Die Folgen einer nicht möglichen Fortführung richten sich nach Ziffer 7 Ihres AVV.
>
> Ansprechpartner: [Name und erreichbare Kontaktadresse].

## Vorbereiteter Ablauf für Rückgabe, Löschung und Vorfälle

Bei Rückgabe oder Löschung zunächst Weisungsberechtigung und Umfang dokumentieren. Neben Leads auch Antwort-Snapshots, Statusverläufe, Mailjobs und Inhalte, Kundenbereiche, Medien, Supportmeldungen und Postfachkopien erfassen. Veröffentlichte Medien nicht allein anhand ihres Dateinamens einem Kunden zurechnen; die vorhandene Eigentümerzuordnung ist zu prüfen. Vor einer Löschung die gewählte Rückgabe und etwaige gesetzliche Ausnahmen klären. Danach die ausgeführten Schritte, verbleibende zulässige Sicherungskopien, deren Ablauf und die Bestätigung festhalten. Ein Löschregister für Wiederherstellungen muss vor einem produktiven Restore ausgewertet werden. Die genannten Anwendungsfunktionen und der Journalablauf sind technisch umgesetzt. Dieser manuelle Gesamtprozess einschließlich Postfächern, externen Empfängern und Kundenbestätigung muss dennoch betrieblich eingeführt und fallbezogen dokumentiert werden.

Bei bekannt gewordenen Datenschutzvorfällen Eingangszeit, betroffene Verarbeitung, verfügbare Fakten und Sofortmaßnahmen festhalten. Den Auftraggeber unverzüglich mit den verfügbaren Informationen benachrichtigen und Nachmeldungen dokumentieren; nicht auf eine vollständig abgeschlossene Untersuchung warten. Zuständigkeit für eigene Behördenmeldungen getrennt prüfen. Berechtigte Betroffenenanfragen unverzüglich an den Auftraggeber weiterleiten und angeforderte Unterstützung nachvollziehbar bearbeiten.

## Noch erforderlich

- Exakte Hetzner-/Alfahosting-Vertragsfassungen samt Leistungs- und TOM-Anlagen im internen Nachweisverzeichnis verknüpfen und mit tatsächlichem Hosting, Sicherungen und SMTP-Dienst abgleichen. Der Abschluss selbst ist bestätigt.
- R10/R11 sind im dokumentierten technischen Umfang umgesetzt. Für den vollständigen organisatorischen Abschluss bleiben Postfach-/Empfängerkopien, ergänzende Auskunftsinformationen und die dokumentierte Bearbeitung konkreter Weisungen zu prüfen.
- Einen vollständigen Anbieterwechsel-Export nicht mit der E-Mail-bezogenen Betroffenenauskunft gleichsetzen; dieser bleibt das gesonderte Paket R15.
- Vor erstmaligem Gebrauch die vorbereiteten manuellen Abläufe betrieblich einführen und ihre Durchführung dokumentieren. Bestandsverträge nicht durch eine Veröffentlichung oder durch technische Migration ersetzen.

Damit sind die beschriebenen Textlücken mit dem aktuellen technischen Stand abgeglichen. Offen bleiben insbesondere konkrete AVV-/TOM-Anlagen, die Einführung manueller Prozesse und der Umgang mit Bestandsverträgen. PR #183 wird als Entwurf aktualisiert; diese Fortsetzung enthält keine Veröffentlichung und keinen Versand an Kunden.

Primärquellen am 09.11.2026 erneut geprüft: [§ 14 BGB](https://www.gesetze-im-internet.de/bgb/__14.html) und [Art. 28 DSGVO](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679), insbesondere Weisungen sowie Rückgabe/Löschung. Die neuen konkreten Leistungsbeschreibungen ergeben sich aus den oben benannten Implementierungen und Betriebsnachweisen, nicht allein aus den Rechtsquellen.
