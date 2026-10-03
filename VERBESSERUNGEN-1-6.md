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
## 4. Mobile Darstellung — offen
## 5. KI-Inhaltsbearbeitung — offen
## 6. Webhook-Warteschlange — offen
