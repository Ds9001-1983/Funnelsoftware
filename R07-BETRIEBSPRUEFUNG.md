# R07 – Schreibtischprüfung der Betriebsabläufe

Stand: 09.11.2026. Dokumentationsprüfung auf Basis des geprüften Produktstands
`191b1e5`. Keine neuen Funktionstests, Produktionszugriffe, echten Fallakten oder
Nachrichten. Alle unten genannten Personen, Kennungen und Abläufe sind synthetisch.
Die bestehenden technischen Testnachweise stehen in [B2B-FORTSCHRITT.md](B2B-FORTSCHRITT.md).

## Vorgehen und Ergebnis

Die Fälle wurden gedanklich anhand der Betriebsanleitung, der leeren Vorlagen und
der gelesenen Implementierung durchgegangen. Geprüft wurden Zuständigkeit,
zulässiger nächster Schritt und erforderlicher Abschlussbeleg. Dies bestätigt
keine Personalschulung, reale Erreichbarkeit oder tatsächliche Kundenbearbeitung.

| Synthetischer Fall | Erwarteter Ablauf / Ergebnis | Abgeglichen mit |
| --- | --- | --- |
| Eine unbekannte Person verlangt Bewerberdaten eines Kunden. | Auftraggeber und Identität klären; keine Treffer oder Kundenzuordnung an ungeprüften Absender offenlegen. Anfrage an festgestellten Verantwortlichen weiterleiten. | Betriebsanleitung Abschnitt 1; Fallvorlage. |
| Die Auskunft findet eine frühere Mailadresse, die aktuelle Lead-Adresse ist anders. | Export kann gespeicherte Mails enthalten. Die E-Mail-Löschung allein entfernt diesen anders adressierten Lead nicht; ergänzende Prüfung bleibt offen. | `server/subject-export.ts`, `storage.deleteLeadsByEmail`, SUBJECT_ACCESS.md. |
| Löschanfrage ergibt `status=queued`, `queuedCount=2`, `deletedCount=0`; externer Rechner ist offline. | Fall auf „wartet auf externe Bestätigung“, keine Abschlussbehauptung. Nächste Kontrolle festhalten; Journal/Bestätigung nicht umgehen. | MANUAL_LEAD_ERASURE.md, `server/routes.ts`, Fallvorlage. |
| Konto ist gesperrt, aber eine direkte öffentliche Upload-URL ist noch erreichbar. | Sperre nicht als vollständig entfernte Datei darstellen. Exakte Bestätigung, Abrechnungsabschluss und tatsächliche Datei-/Datenbanklöschung prüfen. | ACCOUNT_ERASURE.md, Betriebsanleitung Abschnitt 2. |
| Bestandskonto hat keinen digitalen Registrierungsnachweis und antwortet nicht auf ein Vertragsangebot. | Externe Altvereinbarung suchen; keine rückwirkende Annahme, kein Überschreiben des Registrierungsfeldes und keine automatische Preiserhöhung/Sperre. | `server/registration-contract.ts`, Annahmevorlage, Betriebsanleitung Abschnitt 3. |
| Ein anderer Bestandskunde bestätigt später ausdrücklich die angebotenen Dateien. | Fassung, Originalantwort, tatsächlichen Zeitpunkt und Vertretungsrecht privat sichern. Früheren Nachweis erhalten; externen Nachtrag getrennt zuordnen. | Annahmevorlage; Archivlogik und bestehender B2B-Browsertest. |
| Mögliche Offenlegung von Auftragsdaten; Umfang noch ungeklärt. | Bekanntwerden, Unsicherheiten und Sofortmaßnahmen dokumentieren; Auftraggeber unverzüglich informieren. Eigene Rolle/Meldepflicht getrennt prüfen; Nachmeldung terminieren. | Vorfallvorlage; [LfD Niedersachsen](https://www.lfd.niedersachsen.de/verletzung). |
| Es liegt nur eine Anbieterrechnung oder ein öffentliches Vertragsmuster vor. | Nicht als Abgleich des abgeschlossenen AVV verbuchen. Konkretes Exemplar, Anlagen und Produktzuordnung anfordern. | SUPPLIER_EVIDENCE.md, Dienstleistervorlage. |

Bei der Prüfung wurden veraltete Abschlussabsätze in SUBJECT_ACCESS.md,
ACCOUNT_ERASURE.md und MANUAL_LEAD_ERASURE.md korrigiert. Insbesondere unterscheidet
die Auskunftsanleitung jetzt ausdrücklich Löschbeauftragung und tatsächliche Ausführung.

## Noch nicht nachgewiesen

- Konkrete Hetzner-/Alfahosting-AVV-/TOM-Anlagen mit Produkt- und Standortzuordnung.
- Benannte erreichbare Vertretung und tatsächlich organisierte Eingangs-/Fristenkontrolle.
- Private Ablage samt Zugriffskreis und abgestimmtem Übergabeweg für echte Fälle.
- Umfang vorhandener Bestandsvereinbarungen und gegebenenfalls erforderlicher Nachträge.
- Einführung durch den Betreiber und dokumentierte echte oder betreiberseitig erprobte Fallbearbeitung.

Die Betriebsanleitung ist fertig vorbereitet. Die genannten offenen Nachweise
werden dadurch nicht automatisch als erledigt markiert. PR #183 bleibt ein Entwurf;
kein Versand an Kunden und keine neue Bindung bestehender Verträge.
