# Umsetzung 1–6

Auftrag vom 02.10.2026: Jeden Punkt einzeln auf Machbarkeit prüfen, umsetzen,
testen und pushen. Basis `c818f05`, Arbeitsbranch `feat/funnel-improvements-1-6`.
Jeder Punkt wird separat committed und gepusht. Feature-Push führt CI aus;
Produktion wird erst durch Integration in `main` verändert.

## 1. Auswertungen und Besucherwege — umgesetzt

Machbar ohne Schemaänderung: vorhandene Zeitstempel und JSON-Metadaten nutzen.
Ein Zeitraum gilt für Besuche, Leads, Conversion, Quellen und Rangliste.
Neue Wegereignisse verwenden eine zufällige Besuchs-ID ausschließlich im
Arbeitsspeicher pro Seitenaufruf; keine Wiedererkennung zwischen Besuchen.
Historische Ereignisse bleiben erhalten und werden nicht zu Wegen rekonstruiert.
Letzte Seiten ohne Abschluss werden erst nach 30 Minuten Inaktivität angezeigt
und ausdrücklich nicht als bewiesene Abbrüche bezeichnet.

Validierung: Typecheck und Build bestanden, 417 Unit-/Komponententests bestanden
(58 separat aktivierbare Datenbanktests in diesem Lauf ausgelassen). Zwei
Browserabläufe bestanden: Zeitraum/Weganzeige einschließlich Zugriffstrennung
sowie bestehender vollständiger Funnel-Lebenszyklus. Isolierte lokale PostgreSQL
auf Port 55440, UTC; keine Produktionszugriffe.

## 2. Qualitätscheck — umgesetzt

Machbar mit den vorhandenen Dokument- und Strukturprüfern. Der Publikationsdialog
zeigt blockierende Strukturfehler und nicht blockierende Inhaltshinweise mit
Sprung zum Element bzw. zur A/B-Konfiguration. Leere Bilder/Links/Texte,
Formularbeschriftungen, Auswahloptionen und berechenbare Textkontraste werden
geprüft. Keine Behauptung einer vollständigen Barrierefreiheits- oder externen
Linkprüfung. Versteckte Seiten sind von Inhaltshinweisen ausgenommen; laufende
A/B-Alternativen werden berücksichtigt.

Validierung: fünf neue Unit-Tests, Typecheck, Build und zwei Browserabläufe
(Qualitätscheck sowie bestehende Entwurfs-/Publikations-/Wiederherstellungskette)
bestanden.
## 3. Visueller Versionsvergleich — umgesetzt

Machbar auf vorhandenen unveränderlichen Inhaltsversionen. Geschützte API liefert
nur eigene Versionsinhalte; keine Integrationsgeheimnisse oder Leads. Vor der
Veröffentlichung lässt sich Live mit dem aktuellen Entwurf vergleichen, in der
Versionsliste jede frühere Version. Änderungsliste für Inhalte, Reihenfolge,
Design und Regeln sowie zwei statische Seitenvorschauen. A/B-Änderungen erscheinen
in der Liste; Vorschau zeigt Basisinhalte und Personalisierungs-Ersatzwerte.
Wiederherstellung bleibt eine gesonderte Aktion.

Validierung: drei Unit-Tests, Typecheck, Build und zwei Browserabläufe einschließlich
fremder Zugriffe, unverändertem Live-Inhalt, keiner Lead-/Tracking-Anfrage sowie
bestehendem Wiederherstellungsablauf bestanden. Vergleichsansicht visuell geprüft.
## 4. Mobile Darstellung — umgesetzt am 03.10.2026

Machbar mit additiven Inhaltsfeldern, ohne Datenbankmigration. Dokumentversion 6
schützt gerätespezifische Angaben vor älteren Editoren. Handy (<640 px), Tablet
(640–1023 px), Desktop (ab 1024 px): Schriftgrößen für Texte/Buttons/Eingaben,
Elementabstände, Bildhöhe und Ausschnitt. Leere Werte erben Desktop bzw. Bestand.
Canvas misst die gewählte Vorschaugröße; öffentliche Ausgabe und Versionsvergleich
nutzen denselben Renderer. Der Canvas markiert mögliche Überläufe/abgeschnittene
Texte und führt zum Element. Kopieren, Vorlagen, Wiederherstellung und
Antwort-Snapshots verstehen v6. Bestehende Inhalte bleiben unverändert.

Freischaltung nach einem kompatiblen Release über `BUILDER_RESPONSIVE_EDITOR=true`;
Standard ist aus. Der Leser arbeitet auch ohne diese Bearbeitungsfreigabe.
Nach ersten v6-Veröffentlichungen bei einem Rollback den v6-Leser erhalten.

Validierung: 430 Unit-/Komponententests, Typecheck und Build bestanden (58
Datenbanktests separat). Drei Browserabläufe für Layout-Editing, Vergleich und
Geräteeinstellungen bestanden; zusätzliche Prüfung von Überlaufhinweisen und
Schreibschutz bei deaktivierter Fähigkeit bestanden. Handyansicht visuell geprüft.
## 5. KI-Inhaltsbearbeitung — umgesetzt am 03.10.2026

Machbar über die vorhandene BYOK-Anbindung. „Mit KI bearbeiten“ bietet Kürzen,
drei Varianten oder Umschreiben für eine Zielgruppe. Ein Layout-Abschnitt kann
mehrere Texte liefern; jeder Vorschlag wird separat geprüft und übernommen.
Es werden nur die ausgewählten Texte und die Aufgabe an den konfigurierten
Anbieter geschickt, keine Leads oder übrigen Funnel-Inhalte. Pro/Verifizierung,
Eigentümerzugriff und bestehende Generierungslimits werden geprüft.

Die KI darf nur Text vorschlagen; IDs und Platzhalter werden validiert. Übernahme
ändert ausschließlich content, prüft unveränderten Ausgangstext und nutzt die
bestehende Undo-/Entwurfsspeicherung. Links, Stile und Formularfelder bleiben
unberührt. Fehlender Schlüssel und Anbieterfehler werden angezeigt.

Validierung: sechs neue Tests zu Anbieterschnittstelle, Platzhaltern, veralteten
Texten und Erhaltung anderer Felder; Typecheck, Build und Browserablauf inklusive
fehlendem Schlüssel, Zugriffstrennung und unverändertem Live-Stand bestanden.
Anbieterantworten in Tests simuliert; keine kostenpflichtigen KI-Aufrufe ausgeführt.
## 6. Webhook-Warteschlange — umgesetzt am 03.10.2026

Machbar mit einer additiven PostgreSQL-Outbox. Lead und Versandauftrag werden
atomar gespeichert, einschließlich unveränderlichem JSON-Snapshot und Ereignis-ID.
Der Worker beansprucht Aufträge atomar, auch bei mehreren Serverprozessen. Nach
einem Abbruch können abgelaufene Reservierungen erneut verarbeitet werden.
Bis zu fünf Versuche, Wartezeiten 1/5/15/60 Minuten bei Netzwerkfehlern, HTTP
408/429/5xx; andere HTTP-Fehler beenden die Zustellung. Keine Weiterleitungen.
DNS-Ziele werden auf öffentliche IP-Adressen geprüft und für den Verbindungsaufbau
festgehalten; TLS prüft weiterhin den ursprünglichen Hostnamen.

Empfänger müssen mögliche Mehrfachzustellungen über `event_id` bzw.
`Idempotency-Key` deduplizieren. Der Body und die Ereignis-ID bleiben gleich;
die bisherige HMAC-SHA256-Signatur bleibt kompatibel. Ein Timeout kann nach bereits
erfolgter Annahme auftreten, deshalb wird keine Genau-einmal-Zustellung zugesagt.

Vor jedem Versuch werden Konfiguration, Eigentümer und Lead-Freigabe erneut
geprüft. Geänderte/abgeschaltete Webhooks und gesperrte Leads werden abgebrochen.
Paralleler Eingang am Free-Limit ist serialisiert; Erstellungszeit wird erst nach
der Sperre vergeben. Der Verlauf zeigt nur eigene Status-/Versuchsdaten, weder
Payloads noch Geheimnisse. Lead-Löschung entfernt Snapshot und Versuchshistorie.

Betrieb: `node scripts/migrate.mjs` führt die additive Migration vor dem Release aus
(bestehender Deployment-Ablauf). Keine Nachsendung alter Leads. Worker startet mit
dem Server; `DISABLE_WEBHOOK_WORKER=1` pausiert die Verarbeitung. Tests verwenden
diesen Schalter und einen simulierten Transport, niemals echte Empfänger.

Validierung: 28 neue Tests für Transport und isolierten Testbetrieb, 13 neue
PostgreSQL-Tests für atomare Speicherung, parallele Worker, Wiederholungen,
Neustart, Konfigurationswechsel, Free-Limit, Zugriffstrennung und Löschung.
Browserprüfung für realen Lead-Eingang, Deduplizierung, Eigentümerzugriff und
aktualisierten Verlauf bestanden. Typecheck, Build sowie insgesamt 464
Unit-/Komponententests und alle 71 Datenbank-/Migrationstests bestanden.

Die gewachsene Browser-Suite überschritt das gemeinsame Registrierungslimit
(20 pro IP). Höheres Testbudget greift ausschließlich bei explizitem E2E-Modus,
Development, Loopback-Bindung und lokaler E2E-Datenbank. Produktionslimits bleiben
unverändert; die Abgrenzung ist getestet.

Abschließende lokale Gesamtprüfung: alle 45 Browserabläufe bestanden (mit allen
Builder-Freigaben aktiv), einschließlich der bestehenden Editor-, Recruiting-,
Tracking-, Bibliotheks- und Publikationsabläufe.
