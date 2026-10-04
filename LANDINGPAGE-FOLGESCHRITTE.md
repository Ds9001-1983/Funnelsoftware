# Landingpage: Folgeschritte 1–5

Basis: `91e9a2d`, Branch: `feat/landing-conversion-followup`.
Jeder Punkt wird einzeln umgesetzt, geprüft und gepusht.

1. FAQ erklärt Besucherquellen und das kostenlose monatliche Kontingent.
2. Free-Vorschau zeigt Beispieladresse und tatsächliches Trichterwerk-Badge.
3. Öffentliche Demos führen nach Abschluss zur gewählten Vorlage.
4. Öffentliches Kontaktformular nutzt den vorhandenen Maildienst.
5. Mobiler Footer fasst Produkt- und Vergleichslinks zusammen.

Die vorhandenen Tarifrechte bleiben maßgeblich: ein veröffentlichter Funnel
und 100 sichtbare Leads pro Monat im dauerhaften Free-Plan. Die zusätzlich
vorhandene Pro-Testphase wird durch diese Änderungen nicht verändert.
Der Nutzertest (Punkt 6) gehört nicht zu diesem Umsetzungsauftrag.

## Prüfungen

1. Besucherquellen: Typecheck und acht Landing-Browserprüfungen bestanden.
   Die sichtbaren FAQ und JSON-LD verwenden dieselben Texte.

2. Free-Vorschau: Typecheck und zehn Browserprüfungen bestanden, einschließlich
   Registrierung bis Veröffentlichung. Vorschau bei 320 px geprüft; Fokus kehrt
   nach Schließen zum Auslöser zurück. Veröffentlichte Funnels und Vorschau
   verwenden dieselbe Badge-Komponente. Die Vorschau lädt erst beim Öffnen
   und erzeugt keine Leads oder Kundenfunnel-Analytics.
