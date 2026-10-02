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

## 2. Qualitätscheck — offen
## 3. Visueller Versionsvergleich — offen
## 4. Mobile Darstellung — offen
## 5. KI-Inhaltsbearbeitung — offen
## 6. Webhook-Warteschlange — offen
