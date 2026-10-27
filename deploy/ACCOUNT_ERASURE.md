# Kontolöschung mit dauerhafter Sperre und externer Bestätigung

Bei konfiguriertem unabhängigem Journal liefern `DELETE /api/auth/account` und
`DELETE /api/admin/users/:id` HTTP 202 mit `status: "queued"`. Der eigene Auftrag
benötigt das Kontopasswort, der Adminpfad Adminrechte und CSRF-Schutz. Der Auftrag
ist verbindlich und wird bei Wiederholung nicht doppelt angelegt. Die Oberfläche
unterscheidet Beauftragung und abgeschlossene Löschung.

## Sperre und Ausführung

Der neue Journaltyp `queued_account` enthält die stabile Kontokennung, das
Dateimanifest sowie `billingCustomerId` (Stripe-Kundenkennung oder null) und
`billingClosed`. Er enthält keine E-Mail, Zahlungsdaten oder Kontaktinhalte. Die
Stripe-Kennung ist erforderlich, damit ein älteres Backup die Zuordnung zu einem
später angelegten Stripe-Konto nicht verlieren kann. Journal und Kopien bleiben
private Betriebsdaten mit restriktiven Zugriffsrechten.

Das unabhängige Journal ist auch bei SQL-Rollback verbindlich. Anmeldung,
bestehende Sitzungen, API-Schlüssel, Arbeitsbereiche, neue Uploads und neue
Checkout-/Portal-Sitzungen werden gesperrt. Öffentliche Funnels einschließlich
Kundendomains, SSR und Sitemap prüfen die Kontosperre. Der Startcheck repariert
das Datenbankmerkmal vor Start der Anwendung und aller Worker. Bereits laufende
Anfragen können noch enden; Uploads und Billing-Erstellung sind ausdrücklich
gegen die Kontosperre serialisiert. Direkte öffentliche Upload-URLs bleiben bis
zur tatsächlichen Dateilöschung erreichbar. Bereits versandte E-Mails werden
nicht zurückgerufen.

Der Kontoworker prüft jede Minute höchstens drei Aufträge mit wechselndem
Startpunkt. `DISABLE_RETENTION_WORKER=1` oder `DISABLE_SCHEDULER` schalten ihn ab.
Bei einem Stripe-Konto lässt er zuerst alle offenen Checkout-Sitzungen ablaufen,
prüft noch nicht zugeordnete abgeschlossene Subscription-Checkouts und kündigt
alle nicht beendeten Abonnements über sämtliche Ergebnisseiten. Das geschieht
auch bei ausgeschaltetem Mac. Jeder Stripe-Aufruf hat ein Zeitlimit von 15 Sekunden.
Fehler lassen den Auftrag gesperrt und werden erneut versucht. Der erfolgreiche
Abrechnungsabschluss wird als weiterer Journalstand mit `billingClosed: true`
dauerhaft gespeichert. Ohne Stripe-Konto ist dieser Zustand schon beim Auftrag
gegeben. Dies ist keine Rückerstattung und keine Löschung von Stripe-Belegen.

Vor jeder Dateilöschung und Datenbankkaskade benötigt der Worker die aktuelle
externe Bestätigung genau des letzten Manifests einschließlich Billing-Abschluss.
Die Bestätigung darf höchstens 15 Minuten alt sein und muss zu Instanz, Sequenz
und Hash gehören. Eine ältere bestätigte Sequenz reicht nicht. Neue erfasste
Dateizuordnungen erzeugen ein erweitertes Manifest, das ebenfalls zuerst auf den
Mac gelangen muss. Laufender Recruiting-Mailversand verhindert die Löschung;
noch nicht versandte Jobs werden durch die Kontosperre abgewiesen. Dateifehler
lassen das Konto gesperrt. Wiederholung toleriert bereits entfernte Dateien.
Fremde Dateizuordnungen und symbolische Elternverzeichnisse verhindern die Löschung.

## Restore und Formatwechsel

Vor Ausrollen dieser Version **zuerst den Mac-Journaldienst aktualisieren**:
Der alte Parser kennt `queued_account` nicht. Der neue Parser liest auch alle
bisherigen Typen. Den vorhandenen Agenten im Leerlauf stoppen, Programm und
Konfiguration privat sichern, mit unveränderter Konfiguration über
`scripts/install-erasure-backup.mjs` installieren und anschließend `status` sowie
`verify-current` prüfen. Siehe [ERASURE_BACKUP.md](ERASURE_BACKUP.md).

Nach dem ersten neuen Journalauftrag darf kein alter Programmstand ohne diesen
Parser und diese Sperrlogik gestartet werden. Ein altes Release würde das Journal
ablehnen. Ein notwendiger Rücksprung muss die kompatible Journal-/Sperrlogik
beibehalten; das Journal niemals verkürzen oder neu initialisieren.

Der Offline-Replay nach [ERASURE_RESTORE.md](ERASURE_RESTORE.md) entfernt zugeordnete
Dateien und Sitzungen auch für wartende Aufträge. Ist `billingClosed` noch false,
bleibt eine vorhandene Kontozuordnung gesperrt erhalten. Der Kontoworker schließt
nach dem kontrollierten Wiederanlauf die Abrechnung anhand des Journals ab, selbst
wenn das alte Backup das Konto noch gar nicht enthält. Mit bestätigtem
Billing-Abschluss darf Replay auch die Datenbankkaskade ausführen. Die öffentliche
Wiederinbetriebnahme setzt weiterhin den aktuellen Quellenvergleich und den
vollständigen Offline-Replay voraus. Ein Startcheck allein ist keine Restore-Freigabe.

## Prüfungen und Umfang

Die Integrationstests prüfen Offline-Warten, exakte Bestätigungen, SQL-Rollback,
Upload-/Billing-Sperren, Stripe-Fehler, SMTP-Sperren, teilweise Dateifehler,
Manifest-Erweiterung, Dateiwiederkehr und echte pg_dump/pg_restore-Durchläufe vor
Konto- bzw. Stripe-Anlage. Browserprüfungen unterscheiden die 202-Anzeige vom
isolierten direkten Entwicklungsablauf. Stripe-Tests nutzen ausschließlich Mocks.

Ohne Journal ist unmittelbare Löschung nur in Entwicklung/Test möglich. Produktion
benötigt das Journal; Fehler schalten nicht auf unmittelbare Löschung um.
Lead-Einzel- und Sammelaufträge sind in [MANUAL_LEAD_ERASURE.md](MANUAL_LEAD_ERASURE.md)
beschrieben. Analytics-Aufbewahrung und Regeln für logisch gelöschte Funnels
bleiben gesonderte R11-Arbeiten.

Stripe-Referenzen: [Checkout-Sitzungen auflisten](https://docs.stripe.com/api/checkout/sessions/list),
[offene Sitzungen beenden](https://docs.stripe.com/api/checkout/sessions/expire).
