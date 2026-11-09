# Tarifangaben und B2B-Registrierung

Stand: 9. November 2026. Umsetzung auf `fix/b2b-registration-and-pricing`, mit aktuellem Main `58c5dcb` zusammengeführt. PR #183 bleibt ein Entwurf; keine Veröffentlichung in dieser Fortsetzung. Dieses Paket betrifft R05, R06 sowie die technische Einbeziehung und die Überarbeitung der Vertragstexte aus R07 des Systemaudits.

## Ergebnis

Neue Konten geben das Unternehmen oder den vollständigen Namen als Selbstständiger an. Zwei nicht vorausgewählte Pflichtfelder bestätigen geschäftliche Nutzung und Vertretungsberechtigung sowie die Annahme von AGB und AVV. Die Datenschutzerklärung ist eine Information; die gesonderte Marketing-Einwilligung bleibt unabhängig davon.

Die API prüft diese Angaben und die angebotene Vertragsversion. Fehlende Bestätigungen, leere Unternehmensnamen und veraltete Fassungen führen zu HTTP 400 ohne Kontoanlage. Der Server erstellt den Nachweis mit eigenem Zeitstempel, Erklärungstexten, Unternehmensangabe und SHA-256-Prüfsummen der vollständigen HTML-Dokumente. Konto und Nachweis werden mit demselben INSERT gespeichert. Ein Client kann weder den Zeitstempel vorgeben noch den Nachweis über Profiländerungen überschreiben.

Die aktuelle Fassung `2026-11-09` ist vor der Registrierung verlinkt und unter `/api/legal/2026-11-09/agb` sowie `/api/legal/2026-11-09/avv` lesbar. Die Fassungen `2026-10-12` und `2026-10-14` bleiben unverändert im Archiv. `?download=1` liefert einen HTML-Download. Einstellungen → Profil bietet die tatsächlich angenommenen Dokumente und einen JSON-Nachweis einschließlich der vollständigen Texte. Der persönliche Download verlangt eine Anmeldung und verwendet `private, no-store`. Archivtexte dürfen nach Veröffentlichung nicht überschrieben werden; spätere Änderungen benötigen einen neuen Eintrag und eine neue Registrierungsfassung. Prüfsummentests schützen alle drei Fassungen.

Die Registrierung eröffnet einen dauerhaft kostenlosen Plan mit 14 Tagen Pro-Testphase. Der frühere Schalter `SIGNUP_REQUIRE_CARD` und der Registrierungs-Checkout sind entfernt. Kostenpflichtiges Pro wird gesondert im Billing-Checkout bestellt. AGB, Registrierung, Preistabelle und Einstellungen nennen 0 € für Free beziehungsweise 49 €/Monat inklusive Umsatzsteuer für Pro. Das Free-Limit wird als ein veröffentlichter Funnel und 100 sichtbare Leads je UTC-Kalendermonat pro Konto erklärt; weitere Leads bleiben gespeichert und werden durch Pro freigeschaltet.

Die Willkommensmail erklärt den kostenlosen Fortgang und verweist auf die gespeicherten Vertragsunterlagen. Hinweise zum Lead-Limit nennen die Grenze pro Konto und den Pro-Endpreis.

Der aktive Stripe-Preis wurde am 13.10.2026 nur lesend abgefragt (keine neue Preisabfrage am 09.11.): `active=true`, `currency=eur`, `unit_amount=4900`, `tax_behavior=inclusive`, `recurring.interval=month`, `interval_count=1`. Es wurde keine Zahlung oder Checkout-Session erzeugt.

## Migration und Bestandskonten

`20261012_registration_contract.sql` ergänzt ausschließlich die nullable JSONB-Spalte `users.registration_contract`. Kein Backfill und keine erfundene Zustimmung. Bestehende Konten behalten ihren Zugang; ihre Einstellungen zeigen das Fehlen eines digitalen Registrierungsnachweises an. Die normale Kontolöschung entfernt auch diesen Datensatz. Vor dem Deployment gilt weiterhin der vorhandene Ablauf mit frischem Backup, Restore-Prüfung, additiver Migration und anschließender Veröffentlichung.

## Prüfung des Grundpakets am 13. Oktober

- TypeScript für Anwendung und Tests sowie Produktionsbuild.
- 507 Unit-/Integrationstests einschließlich lokaler PostgreSQL-Tests und zweimaliger Migration mit unveränderten Bestandsdaten.
- Neuer mobiler Browsertest: fehlende Annahme, veraltete Fassung, erfolgreiche Registrierung, keine Stripe-Zuordnung, serverseitiger Zeitpunkt, persistierter Nachweis, bytegleiche Archivdownloads, Schutz vor Überschreiben und Download ohne Anmeldung.
- Desktop- und Mobilansichten von Registrierung, AGB und AVV ohne horizontalen Überlauf geprüft.
- 48/48 Browserabläufe bestanden (47 Anwendung + 1 Registrierung). `npm run test:e2e` startet die 47 bestehenden Abläufe und den neuen Registrierungsblock nacheinander in jeweils eigenen Serverprozessen. Einzelne Specs lassen sich über `test:e2e:app` bzw. `test:e2e:registration` auswählen. Damit überschreiten die zusätzlichen ungültigen Anmeldeversuche nicht die unveränderten 20 Versuche pro IP und 15 Minuten. Ein zunächst gemeinsamer Lauf bestand 45/48 Tests; drei spätere Registrierungen wurden erwartungsgemäß mit HTTP 429 gebremst.

Der Browsertest deckte außerdem eine Weiterleitungs-Race-Condition auf: Die Navigation zum ersten Funnel wartet jetzt auf den gerenderten Anmeldestatus.

## Vertragsergänzung am 14. Oktober

Die Fassung `2026-10-14` ergänzt Recruiting, Kundenbereiche, Weisungen, Unterstützung bei Betroffenenrechten und Vorfällen, konkrete Sicherheitsmaßnahmen sowie die getrennte Einordnung von Unterauftragnehmern, Zahlungsabwicklung und kundenseitig gewählten Integrationen. Änderungen weiterer Auftragsverarbeiter werden aktiv per E-Mail mit 30 Kalendertagen Vorlauf angekündigt; der vorbereitete manuelle Ablauf mit Nachrichtenvorlage steht im [R07-Vertragsabgleich](R07-VERTRAGSABGLEICH.md). Es wurde keine Kundennachricht versandt.

Preisänderungen bestehender Abonnements verlangen jetzt ausdrückliche Zustimmung. Widersprüchliche Haftungsausschlüsse und die automatische wirtschaftlich nächstliegende Ersatzklausel wurden überarbeitet. Eine Veröffentlichung ändert bestehende Verträge nicht.

Dennis Sasse hat den Abschluss der AV-Verträge mit Hetzner und Alfahosting im Chat bestätigt. Die konkreten Vertrags- und TOM-Anlagen sind noch nicht eingesehen. Die AVV beschreibt die tatsächlichen Grenzen automatischer Löschung und vorhandener Exporte; entsprechende Betriebs- und Umsetzungslücken werden nicht als durch den Text behoben gewertet.

Gezielte erneute Prüfung: 32 Archiv-/Registrierungsschema-Tests, TypeScript für Anwendung und Tests sowie Produktionsbuild bestanden. Der erweiterte mobile Browsertest ist ebenfalls bestanden; er prüft zusätzlich einen synthetischen historischen Annahmenachweis einschließlich alter Links und bytegleicher Vertragsinhalte. Die vollständigen automatischen Prüfungen werden am aktualisierten PR ausgeführt.

## Weiter offen

Die benannten Textlücken aus R07 sind überarbeitet; eine abschließende juristische Bewertung aller Klauseln wird damit nicht behauptet. Offen bleiben der dokumentenbasierte Abgleich der externen AVV-/TOM-Anlagen sowie die betriebliche Einführung und der Nachweis der vorbereiteten manuellen Abläufe. Die technischen R10-/R11-Pakete sind inzwischen veröffentlicht: Konten-/Dateilöschung, Betroffenenauskunft, kundengesteuerte Aufbewahrung, Löschjournal und Sicherungsfristen. Postfach- und Empfängerkopien bleiben gesondert zu behandeln; ein vollständiger Anbieterwechsel-Export ist weiterhin R15. Einzelheiten und Codebelege stehen im R07-Vertragsabgleich. Bestehende Kunden benötigen gegebenenfalls einen gesonderten Prozess zur dokumentierten Annahme; es wird keine rückwirkende Zustimmung unterstellt. Der PR bleibt ein Entwurf und ist nicht produktiv veröffentlicht.

R09 und R16 sind im technischen Umfang von PR #199 veröffentlicht; Wettbewerberbelege und Betreiberunterlagen bleiben offen. R17 (Partnerbedingungen) bleibt ein eigenständiger offener Auditpunkt. Der kostenpflichtige Checkout wurde nicht mit einer echten Zahlung abgeschlossen; internationale Steuerfälle und Rechnungen sind durch die reine Preisabfrage nicht geprüft.

Rechtliche Bezugspunkte für die Umsetzung: [§ 14 BGB](https://www.gesetze-im-internet.de/bgb/__14.html) und [DSGVO, insbesondere Art. 6 und Art. 28 Abs. 9](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679). Eine elektronische Annahme dokumentiert die abgegebenen Erklärungen, ersetzt jedoch keine Prüfung der tatsächlichen Unternehmereigenschaft oder des Vertragsinhalts.


## Fortsetzung am 9. November 2026

- Main `58c5dcb` in den bestehenden PR-Branch übernommen. Konflikte in
  Registrierung, Auth-Hook, Testprojekten und Migrationstests zusammengeführt.
  Plattform-Widerspruch/DNT/GPC, Löschsperren und alle späteren E2E-Projekte bleiben erhalten.
- Neue Vertragsfassung `2026-11-09` beschreibt den implementierten Umfang der
  E-Mail-bezogenen Auskunft, ausdrücklich aktivierbare Kundenfristen, wartende
  Kontolöschung mit externer Bestätigung und die beschlossenen Sicherungsfristen
  einschließlich Schutzfällen. Die AGB grenzen EU-Hosting auf Anwendung und
  zentrale Datenbank ein. Alte Archivtexte bleiben bytegleich.
- Registrierungstest prüft beide historischen Fassungen einschließlich Downloads
  und Prüfsummen sowie den unveränderten Zugang für ein Bestandskonto ohne Nachweis.
  Eine Annahme der bisherigen Fassung `2026-10-14` wird bei neuer Registrierung
  abgelehnt. Bestehende R12-Registrierungstests erfüllen die neuen Pflichtfelder
  und prüfen weiterhin die Messsperre.
- Beide TypeScript-Prüfungen, Produktionsbuild und 560 Tests ohne Datenbank
  bestanden. Alle 160 Datenbank-/Migrationsprüfungen zusätzlich aktiviert und
  bestanden. Der vollständige Browserlauf besteht mit 62 Abläufen.
- Synthetische lokale Datenbank per pg_dump/pg_restore wiederhergestellt:
  zweimalige additive Migration erhält die Inhalte aller 35 bestehenden Tabellen.
- Registrierung, AGB und AVV bei 1440 und 390 Pixeln geprüft: aktuelle Fassung,
  nicht vorausgewählte Pflichtbestätigungen, keine horizontalen Überläufe oder
  JavaScript-Seitenfehler. Mobile Registrierung und Dienstleistertabelle visuell geprüft.
- Der erste lokale Datenbanklauf hatte zwei Umgebungsabweichungen: Der Mailtest
  verlangt einen Datenbanknamen mit `_test`, und ein vorhandener Aufbewahrungstest
  setzt UTC für neue Zeitstempel voraus. Nach entsprechend eingerichteter eigener
  Wegwerf-Datenbank besteht der vollständige Lauf; keine Produktionskonfiguration
  und kein Produktcode hierfür geändert.
- GitHub-CI wird nach Push des aktualisierten Entwurfs ergänzt.

Private lokale Prüfprotokolle: `~/TrichterwerkBackups/reviews/b2b-2026-11-09/`.
Tests ausschließlich mit synthetischen Daten in lokalen Wegwerf-Datenbanken,
SMTP/Zahlungsdienste deaktiviert. Keine Produktivmigration, kein Deployment
und keine Kundenbenachrichtigung.
