# Vertragsabgleich R07

Stand: 14. Oktober 2026. Ergänzung zu PR #183; Vertragsfassung `2026-10-14`. Die Fassung `2026-10-12` bleibt unverändert. Dieses Dokument unterscheidet Vertragspflichten, nachgewiesene technische Eigenschaften und noch nicht nachgewiesene Betriebsabläufe. Es ist keine abschließende juristische Bewertung aller Klauseln.

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
| Tägliche Sicherung | Nur lesende Produktionsprüfung am 13.10.2026 | Cron täglich 03:00 Serverzeit; Datenbank- und Upload-Sicherungsdateien für 08.–13.10. vorhanden. Keine Inhaltsdaten gelesen. Die Existenz allein beweist keine vollständige Wiederherstellbarkeit jeder täglichen Sicherung. |
| Wiederherstellung bei Releases | `scripts/deploy-production.sh`; Restore-Nachweise des Releases vom 09.10.2026 | Prüfungen vor Veröffentlichung vorhanden. Keine pauschale Behauptung über einen vollständigen Katastrophen-Wiederanlauf. |
| Sicherungsfristen | Nur lesende Prüfung von `backup.sh` | Reguläre Dateien werden per `find -mtime +30` bereinigt: keine exakte 30-Tage-Garantie. Zusätzliche Release-Sicherungen und lokale Prüfsicherungen benötigen einen getrennten Fristenplan. |
| Support-Aufbewahrung | `server/scheduler.ts` | Dateien nach 90, Meldungen nach 365 Tagen im täglichen Lauf. In Postfächern vorhandene Kopien sind davon nicht automatisch erfasst. |
| Vollständige Löschung | `server/storage.ts`, Upload-Speicherung | Datenbank-Kaskaden ersetzen keine Dateibereinigung. R10 bleibt offen; die AVV behauptet keine sofortige vollständige automatische Kontolöschung mehr. |
| Vollständige Rückgabe / Betroffenenrechte | Lead-Export und Recruiting-/Workspace-Schema | Bestehender Export umfasst nicht alle Datenkategorien. Ergänzende Bearbeitung erforderlich; R11 bleibt offen. |
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

Bei Rückgabe oder Löschung zunächst Weisungsberechtigung und Umfang dokumentieren. Neben Leads auch Antwort-Snapshots, Statusverläufe, Mailjobs und Inhalte, Kundenbereiche, Medien, Supportmeldungen und Postfachkopien erfassen. Veröffentlichte Medien nicht allein anhand ihres Dateinamens einem Kunden zurechnen; eine belastbare Zuordnung ist Teil von R10. Vor einer Löschung die gewählte Rückgabe und etwaige gesetzliche Ausnahmen klären. Danach die ausgeführten Schritte, verbleibende zulässige Sicherungskopien, deren Ablauf und die Bestätigung festhalten. Ein Löschregister für Wiederherstellungen muss vor einem produktiven Restore ausgewertet werden. Dieser Absatz ist ein vorbereiteter Soll-Ablauf, kein Nachweis, dass die offenen technischen Schritte bereits funktionieren.

Bei bekannt gewordenen Datenschutzvorfällen Eingangszeit, betroffene Verarbeitung, verfügbare Fakten und Sofortmaßnahmen festhalten. Den Auftraggeber unverzüglich mit den verfügbaren Informationen benachrichtigen und Nachmeldungen dokumentieren; nicht auf eine vollständig abgeschlossene Untersuchung warten. Zuständigkeit für eigene Behördenmeldungen getrennt prüfen. Berechtigte Betroffenenanfragen unverzüglich an den Auftraggeber weiterleiten und angeforderte Unterstützung nachvollziehbar bearbeiten.

## Noch erforderlich

- Exakte Hetzner-/Alfahosting-Vertragsfassungen samt Leistungs- und TOM-Anlagen im internen Nachweisverzeichnis verknüpfen und mit tatsächlichem Hosting, Sicherungen und SMTP-Dienst abgleichen. Der Abschluss selbst ist bestätigt.
- R10: vollständige, einem Eigentümer zuordenbare Dateilöschung und Umgang mit Supportkopien umsetzen und prüfen.
- R11: vollständige Rückgabe/Betroffenenauskunft, Löschfristen und ein bei Wiederherstellung nutzbarer Löschprozess; gesonderte Fristen für Release- und lokale Sicherungen festlegen.
- Vor erstmaligem Gebrauch die vorbereiteten manuellen Abläufe betrieblich einführen und ihre Durchführung dokumentieren. Bestandsverträge nicht durch eine Veröffentlichung oder durch technische Migration ersetzen.

Damit sind die beschriebenen Textlücken bearbeitet. Die offenen Betriebs- und Datenlebenszyklusfragen werden nicht allein durch neue Vertragssätze als erledigt eingestuft. PR #183 bleibt bis zu ihrer Klärung ein Entwurf und wird durch dieses Paket nicht veröffentlicht.
