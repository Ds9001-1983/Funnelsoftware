# Abgleich der Dienstleisterunterlagen

Stand: 09.11.2026. Der Betreiber hat den Abschluss der AV-Verträge mit Hetzner und
Alfahosting bereits bestätigt. Die konkret abgeschlossenen Fassungen und Anlagen
liegen zur Prüfung weiterhin nicht vor. Diese Unterscheidung bleibt erhalten.

## Benötigte Unterlagen

Je Anbieter: heruntergeladenes Vertragsexemplar, Abschluss-/Annahmenachweis,
Leistungs- und Datenartenanlage, zugehörige TOM-Fassung, Unterauftragnehmerliste
und Zuordnung zu den tatsächlich verwendeten Produkten. Elektronischer Abschluss
ist möglich; eine handschriftliche Unterschrift wird nicht pauschal verlangt.

| Anbieter | Technisch verwendeter Umfang | Konkreter Abgleich |
| --- | --- | --- |
| Hetzner | Plattformserver, zentrale Datenbank, öffentliche/private Uploads und Sicherungen | Konto/Vertragspartner, konkrete Produkte und Standorte, erfasste Lead-/Bewerber-/Supportdaten, TOM-Zuständigkeit für Infrastruktur gegenüber eigener Anwendung, Dienstleister und Backupumfang. |
| Alfahosting | SMTP-Versand, insbesondere Recruiting-Mails, Benachrichtigungen und Supportanhänge | Tatsächlicher Tarif/SMTP-Dienst, Nachrichteninhalte/Empfänger/Anhänge, Speicher- und Logfristen, Postfachkopien, Standorte, Subunternehmen, Löschung und Vorfallkontakte. |

Prüfergebnis je Position: **belegt**, **abweichend**, **unklar** oder **nicht vorgelegt**.
Seite/Abschnitt und Datum nennen; ein Häkchen ohne Fundstelle genügt nicht. Änderungen
an Produkt oder öffentlicher Aussage erst aus dem belegten Ergebnis ableiten.

## Bezugsquellen und Grenzen

Hetzner nennt in seiner [eigenen Dokumentation](https://docs.hetzner.com/de/general/company-and-policy/data-protection-at-hetzner/)
den [AVV-Bereich des Kundenkontos](https://accounts.hetzner.com/account/dpa).
Dort erfolgt der elektronische Abschluss; Anlage 1 enthält die gewählten Datenarten
und Personengruppen. Die Dokumentation verlinkt auch TOMs und Subunternehmen.
Ein öffentlicher Mustervertrag ersetzt das eigene abgeschlossene Exemplar nicht.

Bei Alfahosting ist die [öffentliche Datenschutzerklärung](https://alfahosting.de/datenschutz/)
keine Kopie des kundenspezifischen AV-Vertrags. Den vorhandenen Vertrag samt Anlagen
aus der eigenen Vertragsablage bzw. über den Anbieter bereitstellen. Ein konkreter
Menüpfad im angemeldeten Kundencenter wurde nicht verifiziert.

Öffentliche Quellen am 09.11.2026 geprüft. Es wurde kein Anbieterlogin durchgeführt,
kein Vertrag neu abgeschlossen, geändert oder gelöscht und kein Support angeschrieben.

## Prüfung und Ablage

1. Dateien privat außerhalb des Repositories sichern. Quelle, Abrufdatum, Fassung
   und SHA-256 festhalten; bestehende Exemplare nicht überschreiben.
2. Vertragspartner und Annahme dem tatsächlich genutzten Konto/Produkt zuordnen.
3. Datenarten, Personengruppen und Leistungen mit obiger Tabelle sowie
   `server/email.ts`, `server/recruiting-mail.ts`, `server/account-files.ts` und
   `deploy/BACKUP_AUTOMATION.md` vergleichen. Nur notwendige Konfigurationsangaben
   dokumentieren; keine SMTP-Schlüssel oder Produktionsdaten kopieren.
4. Drittlandbezug, Dienstleister, Auskunft/Löschung, Vorfallkontakte und Änderungen
   prüfen. Die Firmenanschrift allein belegt keinen Datenstandort.
5. Abweichungen samt nötiger Korrektur dokumentieren. Die öffentliche AVV und
   Datenschutzerklärung erst danach als in diesem Umfang abgeglichen kennzeichnen.

Für den Fallbericht die [Dienstleistervorlage](privacy-templates/supplier-review.md)
verwenden. Vertragsexemplare und ausgefüllte Berichte bleiben privat.

## Ergebnis dieser Fortsetzung

Die Suche nach passend benannten Dateien im Projekt, in Dokumente und Downloads
lieferte keine eindeutig passenden Vertragsanlagen. Eine gefundene Hetzner-PDF
ist anhand ihrer Textmerkmale eine Rechnung; AVV-/TOM-Begriffe wurden darin nicht
gefunden. Das beweist weder, dass die Verträge fehlen, noch durchsucht es sämtliche
Cloudablagen oder Postfächer. Der Ablageort wurde beim Betreiber erfragt.
