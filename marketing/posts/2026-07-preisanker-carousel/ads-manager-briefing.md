# Ads Manager: Preis-Anker als Carousel-Anzeige

Anleitung zum Nachbauen des 5-Karten-Carousels im Ads Manager. Per API geht es
nicht: Das Ads-Tooling kennt nur Einzelbild, Video und Katalog-Carousel — ein
manuelles Multi-Karten-Carousel mit eigenen Bildern ist nicht vorgesehen, und
Bild-Upload ins Werbekonto unterstützt es ebenfalls nicht.

Rechnen mit rund 15 Minuten. Alle Dateien und Texte liegen in diesem Ordner.

---

## Vorher

| | |
|---|---|
| Werbekonto | **Trichterwerk by SUPERBRAND.marketing** (`1237422793575988`) |
| Seite | **Trichterwerk** (`1289410607579978`) |
| Pixel | **Trichterwerk PIXEL** (`1328032266066211`) |
| Bilder | `fb/slide-1.png` … `fb/slide-5.png` — die **4:5**-Fassung, nicht die 3:4-Slides |

**Warum 4:5 und nicht die Instagram-Slides:** Der Anzeigen-Feed schneidet 3:4 ab.
Die `fb/`-Renders sind exakt dafür gemacht. Carousel-Karten werden ohnehin
quadratisch beschnitten — die Slides sind so gebaut, dass die Kernaussage mittig
sitzt und das überlebt.

---

## 1 · Kampagne

| Feld | Wert |
|---|---|
| Name | `Trichterwerk \| Preis-Anker \| Traffic` |
| Ziel | **Traffic** |
| Kaufart | Auktion |
| Budgetoptimierung (CBO) | **an** |
| Tagesbudget | **10 €** zum Start |
| Sonderkategorie | **keine** |

Zu „Sonderkategorie": Trichterwerk ist B2B-Software — weder Kredit, Beschäftigung,
Wohnungswesen noch Politik. Nicht aus Vorsicht etwas ankreuzen, das schränkt die
Zielgruppenwahl unnötig ein.

Bei 10 €/Tag rechne mit grob 1.500–4.000 Impressionen täglich. Weniger als 5 €
lohnt nicht — Meta braucht Datenpunkte zum Lernen.

---

## 2 · Anzeigengruppe

| Feld | Wert |
|---|---|
| Name | `Preis-Anker \| DE \| Breit` |
| Conversion-Ort | Website |
| Pixel | Trichterwerk PIXEL |
| Land | **Deutschland** |
| Alter | **25–55** |
| Geschlecht | alle |
| Sprache | Deutsch |
| Detailliertes Targeting | **leer lassen** |
| Advantage+ Zielgruppe | **an** |
| Platzierungen | **Advantage+ (automatisch)** |

**Targeting bewusst breit.** Das ist kein Versäumnis: Bei kleinen Budgets findet
Metas Algorithmus die Zielgruppe zuverlässiger als eine manuelle Interessenauswahl,
und jede Einschränkung verteuert den Tausenderkontaktpreis. Interessen wie
„Online-Marketing" oder „Unternehmer" sind zudem massiv überbucht.

**Placements automatisch lassen** — sonst fällt Instagram womöglich raus, und genau
dort soll das Carousel laufen.

---

## 3 · Anzeige

Format: **Carousel**, Karten in der Reihenfolge **1 → 5**. „Beste Karte zuerst
anzeigen" **ausschalten** — die Dramaturgie hängt an der Reihenfolge, Slide 1 ist
der Hook und Slide 5 der Abschluss.

### Primärtext (über allen Karten)

```
2.000–5.000 € für einen einzigen Funnel. Muss das wirklich sein?

Eine Agentur nimmt für einen Funnel schnell vierstellig. Erstgespräch, Konzept,
Texte, Design, Umsetzung, Korrekturschleifen — mehrere Wochen später ist er live.
Und jede Änderung danach kostet wieder.

Mit Trichterwerk baust du ihn selbst:

→ 49 €/Monat statt vierstellig pro Funnel
→ Unbegrenzte Funnels, unbegrenzte Leads
→ 13 fertige Vorlagen — der erste ist in unter einer Stunde live
→ A/B-Tests, Quiz-Logik, eigene Domain und Live-Analytics inklusive
→ DSGVO-konform, Hosting in der EU, Made in Germany

14 Tage kostenlos testen. 49 €/Monat zzgl. MwSt., monatlich kündbar.
```

Gegenüber der organischen Caption sind „Kein Code. Keine Agentur." und die Hashtags
raus — in Anzeigen ziehen Hashtags nicht und kosten nur Zeilen. Der Preishinweis
**muss** drin bleiben (siehe Leitplanken unten).

### Karten

| # | Bild | Überschrift | Beschreibung |
|---|---|---|---|
| 1 | `fb/slide-1.png` | Was eine Agentur kostet | 2.000–5.000 € pro Funnel |
| 2 | `fb/slide-2.png` | Und wie lange es dauert | Vier Stationen bis zum Livegang |
| 3 | `fb/slide-3.png` | 49 € im Monat | Unbegrenzt viele Funnels |
| 4 | `fb/slide-4.png` | Alles drin | Vorlagen, A/B-Tests, eigene Domain |
| 5 | `fb/slide-5.png` | 14 Tage kostenlos testen | Monatlich kündbar |

Überschriften sind knapp gehalten — auf der Karte stehen sie unter einer schmalen
Vorschau und werden sonst abgeschnitten.

### Ziel-URL (bei **allen** fünf Karten identisch)

```
https://trichterwerk.de/register?utm_source=instagram&utm_medium=paid_feed&utm_campaign=preisanker_carousel&utm_content=card
```

**Call-to-Action:** „Mehr dazu"

Auf `/register` statt auf die Startseite, weil die Slides den Trial bereits
verkauft haben — ein zusätzlicher Zwischenschritt kostet nur Conversions.

`utm_medium=paid_feed` trennt die bezahlte Ausspielung sauber von `social`
(organisch) und `paid_story` (Story-Ads). So bleiben die Quellen im
Admin-Dashboard unterscheidbar.

---

## 4 · Vor dem Aktivieren prüfen

- [ ] Reihenfolge 1–5, „beste Karte zuerst" **aus**
- [ ] Alle fünf Karten zeigen auf dieselbe URL **mit** UTM
- [ ] Pixel „Trichterwerk PIXEL" ausgewählt
- [ ] Vorschau für **Instagram Feed** *und* **Facebook Feed** angesehen
- [ ] Platzierungen automatisch
- [ ] Sonderkategorie leer

Zum Tracking: `PageView` und `CompleteRegistration` sind seit dem Deploy live und
verifiziert. Beide feuern erst **nach** Marketing-Einwilligung im Cookie-Banner —
in den Statistiken landen also nur einwilligende Besucher. `Purchase` erscheint,
sobald das erste Trial ausläuft und abgerechnet wird.

---

## Inhaltliche Leitplanken

Aus dem [README](README.md), gelten unverändert:

- **„2.000–5.000 €" als Spanne**, nie als Pauschalaussage über alle Agenturen.
- **„49 €/Monat zzgl. MwSt."** muss sichtbar bleiben — die Preise sind netto und
  der Kanal erreicht auch Verbraucher.
- **Keine Wettbewerbernamen.** Vergleichende Werbung ist zulässig, aber
  prüfpflichtig — in einer Anzeige unnötiges Risiko.
- **Keine erfundenen Testimonials oder Nutzerzahlen.**
- **„13 fertige Vorlagen"** ist gegen `client/src/lib/templates.ts` gezählt. Bei
  Template-Änderungen nachziehen, sonst steht eine falsche Zahl in einer Anzeige.

---

## Nach 3–4 Tagen

Nicht früher bewerten und **nicht täglich nachjustieren** — Metas Lernphase
braucht etwa 50 Conversions, jede Änderung setzt sie zurück.

| Beobachtung | Bedeutung | Reaktion |
|---|---|---|
| CTR < 0,5 % | Hook zieht nicht | Slide 1 tauschen, nicht die Zielgruppe |
| CTR ok, keine Registrierungen | Landingpage bricht ab | `/register` prüfen, nicht die Anzeige |
| CPC > 1,50 € | Zielgruppe zu teuer | Alter auf 30–50 verengen |
| Frequenz > 2,5 | Zielgruppe ausgereizt | Creative wechseln |

Läuft es an, ist die naheliegende zweite Anzeigengruppe ein **Retargeting** auf
Website-Besucher der letzten 30 Tage — dafür sammelt der Pixel ab jetzt die Daten.
