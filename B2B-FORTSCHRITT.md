# Tarifangaben und B2B-Registrierung

Stand: 13. Oktober 2026. Umsetzung auf `fix/b2b-registration-and-pricing`, ausgehend vom produktiven Datenschutzstand `d1abe27`. Dieses Paket betrifft R05, R06 und die technische Einbeziehung aus R07 des Systemaudits.

## Ergebnis

Neue Konten geben das Unternehmen oder den vollständigen Namen als Selbstständiger an. Zwei nicht vorausgewählte Pflichtfelder bestätigen geschäftliche Nutzung und Vertretungsberechtigung sowie die Annahme von AGB und AVV. Die Datenschutzerklärung ist eine Information; die gesonderte Marketing-Einwilligung bleibt unabhängig davon.

Die API prüft diese Angaben und die angebotene Vertragsversion. Fehlende Bestätigungen, leere Unternehmensnamen und veraltete Fassungen führen zu HTTP 400 ohne Kontoanlage. Der Server erstellt den Nachweis mit eigenem Zeitstempel, Erklärungstexten, Unternehmensangabe und SHA-256-Prüfsummen der vollständigen HTML-Dokumente. Konto und Nachweis werden mit demselben INSERT gespeichert. Ein Client kann weder den Zeitstempel vorgeben noch den Nachweis über Profiländerungen überschreiben.

Die Fassung `2026-10-12` ist vor der Registrierung verlinkt und unter `/api/legal/2026-10-12/agb` sowie `/api/legal/2026-10-12/avv` lesbar. `?download=1` liefert einen HTML-Download. Einstellungen → Profil bietet die angenommenen Dokumente und einen JSON-Nachweis einschließlich der vollständigen Texte. Der persönliche Download verlangt eine Anmeldung und verwendet `private, no-store`. Archivtexte dürfen nach Veröffentlichung nicht überschrieben werden; spätere Änderungen benötigen einen neuen Eintrag und eine neue Registrierungsfassung. Prüfsummentests schützen die vorhandene Fassung.

Die Registrierung eröffnet einen dauerhaft kostenlosen Plan mit 14 Tagen Pro-Testphase. Der frühere Schalter `SIGNUP_REQUIRE_CARD` und der Registrierungs-Checkout sind entfernt. Kostenpflichtiges Pro wird gesondert im Billing-Checkout bestellt. AGB, Registrierung, Preistabelle und Einstellungen nennen 0 € für Free beziehungsweise 49 €/Monat inklusive Umsatzsteuer für Pro. Das Free-Limit wird als ein veröffentlichter Funnel und 100 sichtbare Leads je UTC-Kalendermonat pro Konto erklärt; weitere Leads bleiben gespeichert und werden durch Pro freigeschaltet.

Die Willkommensmail erklärt den kostenlosen Fortgang und verweist auf die gespeicherten Vertragsunterlagen. Hinweise zum Lead-Limit nennen die Grenze pro Konto und den Pro-Endpreis.

Der aktive Stripe-Preis wurde nur lesend erneut abgefragt: `active=true`, `currency=eur`, `unit_amount=4900`, `tax_behavior=inclusive`, `recurring.interval=month`, `interval_count=1`. Es wurde keine Zahlung oder Checkout-Session erzeugt.

## Migration und Bestandskonten

`20261012_registration_contract.sql` ergänzt ausschließlich die nullable JSONB-Spalte `users.registration_contract`. Kein Backfill und keine erfundene Zustimmung. Bestehende Konten behalten ihren Zugang; ihre Einstellungen zeigen das Fehlen eines digitalen Registrierungsnachweises an. Die normale Kontolöschung entfernt auch diesen Datensatz. Vor dem Deployment gilt weiterhin der vorhandene Ablauf mit frischem Backup, Restore-Prüfung, additiver Migration und anschließender Veröffentlichung.

## Prüfung

- TypeScript für Anwendung und Tests sowie Produktionsbuild.
- 507 Unit-/Integrationstests einschließlich lokaler PostgreSQL-Tests und zweimaliger Migration mit unveränderten Bestandsdaten.
- Neuer mobiler Browsertest: fehlende Annahme, veraltete Fassung, erfolgreiche Registrierung, keine Stripe-Zuordnung, serverseitiger Zeitpunkt, persistierter Nachweis, bytegleiche Archivdownloads, Schutz vor Überschreiben und Download ohne Anmeldung.
- Desktop- und Mobilansichten von Registrierung, AGB und AVV ohne horizontalen Überlauf geprüft.
- 48/48 Browserabläufe bestanden (47 Anwendung + 1 Registrierung). `npm run test:e2e` startet die 47 bestehenden Abläufe und den neuen Registrierungsblock nacheinander in jeweils eigenen Serverprozessen. Einzelne Specs lassen sich über `test:e2e:app` bzw. `test:e2e:registration` auswählen. Damit überschreiten die zusätzlichen ungültigen Anmeldeversuche nicht die unveränderten 20 Versuche pro IP und 15 Minuten. Ein zunächst gemeinsamer Lauf bestand 45/48 Tests; drei spätere Registrierungen wurden erwartungsgemäß mit HTTP 429 gebremst.

Der Browsertest deckte außerdem eine Weiterleitungs-Race-Condition auf: Die Navigation zum ersten Funnel wartet jetzt auf den gerenderten Anmeldestatus.

## Weiter offen

Das Paket dokumentiert den Abschluss technisch; die inhaltliche Vertragsprüfung aus R07 bleibt offen. Insbesondere: AVV-Leistungsbeschreibung für Recruiting und Kundenbereiche, Rollen der Dienstleister, tatsächliche TOMs und externe AV-Verträge, aktive Benachrichtigung bei Subunternehmeränderungen sowie Haftungs- und Preisanpassungsklauseln. Die übrigen bestehenden Klauseln wurden übernommen, nicht als rechtlich abschließend geprüft eingestuft. Bestehende Kunden benötigen gegebenenfalls einen gesonderten Prozess zur dokumentierten Annahme; es wird keine rückwirkende Zustimmung unterstellt.

R09 (Werbeaussagen), R16 (Impressum) und R17 (Partnerbedingungen) sind eigenständige offene Auditpunkte. Der kostenpflichtige Checkout wurde nicht mit einer echten Zahlung abgeschlossen; internationale Steuerfälle und Rechnungen sind durch die reine Preisabfrage nicht geprüft.

Rechtliche Bezugspunkte für die Umsetzung: [§ 14 BGB](https://www.gesetze-im-internet.de/bgb/__14.html) und [DSGVO, insbesondere Art. 6 und Art. 28 Abs. 9](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679). Eine elektronische Annahme dokumentiert die abgegebenen Erklärungen, ersetzt jedoch keine Prüfung der tatsächlichen Unternehmereigenschaft oder des Vertragsinhalts.
