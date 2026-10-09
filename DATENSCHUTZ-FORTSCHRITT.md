# Datenschutzpaket: Tracking, Einwilligungen und Werbe-E-Mails

Stand: 9. Oktober 2026. Arbeitsbranch: `fix/privacy-consent-and-email`.
Ausgangspunkt: Produktionsrelease `c818f05`, danach Commit `3528662` zum
Pausieren der Rückgewinnungsmails. Das vollständige Paket wird auf diesem
Branch zur Prüfung bereitgestellt; es ist noch nicht veröffentlicht.

## Umgesetzter technischer Umfang

- Plattform-Einwilligung mit Fassung, Zeitpunkt, Ablauf und Widerruf in einer
  eigenen Tabelle; nur gehashte Browser-Token. Registrierung und Anmeldung
  ordnen geeignete anonyme Nachweise dem Konto zu. Ein anderes Konto kann sie
  nicht übernehmen. Alte Konto-Booleans gelten nicht als Freigabe.
- Registrierungs- und Kaufereignisse prüfen den aktuellen Nachweis direkt vor
  dem Versand. Versand, Austausch und Widerruf verwenden Datenbanksperren.
  Kontoweiter Widerruf ist angemeldet ohne Browser-Token und mit einem noch
  vorhandenen zugeordneten Token auch nach dem Logout möglich.
- Zustimmung für Plattform und jeden Kunden-Funnel getrennt; geänderte
  Datenschutz-/Impressumslinks, Pixel, GTM oder CAPI-Konfiguration erfordern
  eine neue Auswahl. Ohne gültigen Datenschutzlink kein optionales Tracking.
- Verlorene Antworten und fehlgeschlagene Änderungen sperren Browser-Tracking
  und erhalten einen sichtbaren Wiederholungsbedarf über Neuladen hinweg.
  Ablauf und Widerruf aus einem zweiten Tab werden berücksichtigt. Nach der
  Wiederherstellung einer Seite aus dem Back/Forward-Cache werden Browser-
  und Server-Nachweis erneut geprüft; ein inzwischen erfolgter Widerruf
  beendet bereits geladene Tracking-Skripte.
- YouTube, Vimeo, Calendly und Cal.com laden erst nach bewusster Aktivierung.
  Der Hinweis am Video kann auf schmalen Bildschirmen mit seinem Text wachsen,
  damit der Aktivierungsknopf nicht abgeschnitten wird.
- Kunden-GTM wird ausschließlich auf der verifizierten eigenen Kundendomain
  freigegeben. Kontozugriffe über Kundendomains werden serverseitig abgewiesen.
  Beim Wechsel zwischen Plattform und Kunden-Funnels beendet ein vollständiger
  Seitenwechsel bereits geladene Skripte. Meta-Ereignisse adressieren ein
  konkretes Pixel statt alle initialisierten Pixel.
- Affiliate-Code nur aus dem aktuellen Registrierungslink; keine dauerhafte
  Speicherung im Browser. A/B-Zuweisungen ohne Analysefreigabe nur im Speicher
  des laufenden Dokuments. Lead-Nachweise enthalten die Einwilligungsfassung.
- Die Rückgewinnungsmail bleibt deaktiviert. Der Bereinigungslauf entfernt
  abgelaufene bzw. widerrufene Plattform-Nachweise nach 365 weiteren Tagen.

## Validierung

- `npm run check:all` und Produktionsbuild bestanden.
- 490 Unit-/Integrationstests in einem Gesamtlauf bestanden, einschließlich
  der 14 Tests des Bewerbermail-Workers, neun serverseitigen Einwilligungstests
  und zwei Migrationstests. Zwei neue Regressionstests waren vor der Korrektur
  rot: lokaler bzw. serverseitiger Widerruf bei Browser-Wiederherstellung.
- Die Migration wurde in einem isolierten Schema zweimal angewendet.
  Bestehende Funnel-Inhalte, IDs, Antworten und Lead-Status blieben erhalten;
  die neue Nachweistabelle startet leer, `leads.consent_version` bleibt für
  Bestandsdaten zunächst `NULL`.
- Abschließender Browser-Gesamtlauf: **47 von 47 bestanden**, mit aktivierten
  Builder-Paketen und einem Worker wie in CI. Acht neue Datenschutzfälle prüfen
  CSRF/Logout-Widerruf,
  verlorene Serverantworten, getrennte Kundenfreigaben, mobile Einbettungen,
  Domain-/Kontozugriffssperren, Affiliate-Speicher, Widerruf im zweiten Tab und
  die Beendigung geladener Tracking-Skripte nach simulierter Wiederherstellung
  einer Seite aus dem Browsercache.
  Die zusätzlichen Rechtslinks der Test-Funnels werden über die vorhandene
  Änderungs-API gesetzt, da die Erstellungs-API diese Felder nicht annimmt.
- Alle Datenbank-/Browserprüfungen nutzten einen eigenen lokalen PostgreSQL-
  Prozess mit Wegwerfdatenbanken. Stripe, SMTP und Hintergrundversand waren im
  Testserver deaktiviert; Drittanbieterabrufe der neuen Browserfälle abgefangen.
- Eine zusätzliche Probe mit drei Browser-Workern traf die vorhandenen
  Anfragelimits der gemeinsamen Loopback-IP (44 bestanden, drei HTTP-429-Fehler).
  Die Schutzgrenzen blieben unverändert; der abschließende Gesamtlauf mit der
  CI-Parallelität bestand vollständig. Die bekannte PostCSS-Warnung besteht fort.

## Veröffentlichung und verbleibender Umfang

Dieses Paket ist noch nicht veröffentlicht. Die neue additive Migration
`migrations/20261007_marketing_consent.sql` muss vor dem aktualisierten Server
angewendet werden; der vorhandene Produktionsablauf unterstützt SQL-Migrationen.
Der Remote-Main wurde am 9. Oktober erneut abgerufen und steht unverändert
auf `c818f05`; ein Abgleich mit zwischenzeitlichen Produktionsänderungen
bleibt vor einer Veröffentlichung erforderlich. Kein Rückspielen einer alten
Datenbank.

Die Änderung bearbeitet die technische Grundlage aus R01–R04, den Affiliate-
und A/B-Speicherteil von R12 sowie die Begrenzung kundeneigener Skripte aus R18
des lokalen Audits `RECHTSPRUEFUNG-SYSTEM-2026-10-06.md` im Hauptarbeitsverzeichnis.
Sie ersetzt keine Abnahme einer echten Kundendomain und keine Prüfung aller
kundeneigenen GTM-Tags. Deren tatsächliche Inhalte sind nicht aus einer
Container-ID ableitbar. Die übrigen Auditpakete, einschließlich Vertrags- und
Tarifangaben, Rechtslinks als Veröffentlichungsvoraussetzung, Dateilöschung,
vollständigem Export und betrieblichen Nachweisen, bleiben gesonderte Arbeit.

Die zusätzliche lokale Dokumentation `STRIPE-PRUEFUNG-2026-10-08.md`
hat den tatsächlich konfigurierten Live-Schlüssel mit lesenden Stripe-Anfragen
als aktuell gültig bestätigt. Sie ist keine Veröffentlichung dieses Pakets.
