# Ads Manager: Preis-Anker als Carousel-Anzeige

Anleitung zum Nachbauen des 5-Karten-Carousels im Ads Manager. Rechnen mit rund
15 Minuten. Alle Dateien und Texte liegen in diesem Ordner.

Warum von Hand und nicht per API: Statische Carousels kann das Ads-Tooling
inzwischen anlegen (`cards`, 2–10 Karten). Was fehlt, ist die
**Instagram-Account-ID** — das dafür nötige Tool ist für dieses Werbekonto nicht
freigeschaltet. Ohne `instagram_user_id` liefert ein neu erzeugtes Creative
**nicht auf Instagram** aus, und dort kamen 2 von 3 Besuchern her (99 von 150
Klicks). Deshalb bleibt der Weg über die Oberfläche.

---

## ⚠️ Offen: Korrektur der laufenden Anzeige (Stand 27.07.2026)

Die Kampagne lief vom 24.–27.07. und hat **175 Besucher** auf die Startseite
gebracht — davon haben **2 die Registrierung gesehen** (1,1 %). Ursache: alle
fünf Karten verlinkten `https://trichterwerk.de/` statt `/register`, und die
Karten-Überschriften waren leer.

**Die Anzeigengruppe ist derzeit PAUSIERT.** Das Optimierungsziel wurde bereits
per API auf *Landingpage-Aufrufe* umgestellt; Meta erzwingt dabei eine Pause.
Erst diese Liste abarbeiten, dann reaktivieren:

- [ ] Ziel-URL aller 5 Karten auf `/register` **mit UTM** (Abschnitt 3)
- [ ] Überschrift + Beschreibung je Karte füllen (aktuell ein Leerzeichen)
- [ ] Call-to-Action auf **„Registrieren"** ändern (vorher „Mehr dazu")
- [ ] Bilder `fb/slide-3.png` und `fb/slide-5.png` **neu hochladen** — die
      Preisangabe darauf wurde auf „inkl. MwSt." korrigiert
- [ ] Primärtext prüfen: muss „inkl. MwSt." sagen
- [ ] Anzeigengruppe `120249398157080269` reaktivieren

Die Lernphase setzt sich dabei zurück. Das ist kein Verlust — sie hatte in
3,5 Tagen null Conversions und damit nichts gelernt.

**IDs:** Kampagne `120249398137850269` · Anzeigengruppe `120249398157080269` ·
Anzeige `120249398718750269` · Creative `1720837492939272`

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
| Alter | **25–55** (aktuell live: 18–65) |
| Geschlecht | alle |
| Sprache | Deutsch |
| Detailliertes Targeting | **leer lassen** |
| Advantage+ Zielgruppe | **an** |
| Platzierungen | **Advantage+ (automatisch)** |
| Performance-Ziel | **Landingpage-Aufrufe** maximieren |

**Warum Landingpage-Aufrufe und nicht Link-Klicks:** Link-Klicks zählen jeden
Daumen, der abrutscht — von 206 Klicks kamen nur 158 auf der Seite an. Meta misst
Landingpage-Aufrufe im eigenen In-App-Browser und braucht dafür **keinen Pixel**
(belegt: 158 gemessene Aufrufe bei 0 Pixel-Events). Das Ziel funktioniert also
trotz Consent-Blindheit.

*Nicht* auf `CompleteRegistration` optimieren: Meta braucht dafür ~50 Conversions
pro Woche und Anzeigengruppe. Bei 10 €/Tag ist das unerreichbar — die
Anzeigengruppe bliebe dauerhaft in der Lernphase.

**Targeting bewusst breit.** Das ist kein Versäumnis: Bei kleinen Budgets findet
Metas Algorithmus die Zielgruppe zuverlässiger als eine manuelle Interessenauswahl,
und jede Einschränkung verteuert den Tausenderkontaktpreis. Interessen wie
„Online-Marketing" oder „Unternehmer" sind zudem massiv überbucht.

**Placements automatisch lassen** — sonst fällt Instagram womöglich raus, und genau
dort soll das Carousel laufen.

### Falle beim Duplizieren: Standort-Targeting

Beim Kopieren einer Anzeigengruppe meldet Meta:

> „Deine Zielgruppe beinhaltet eine der folgenden Standort-Targeting-Optionen, die
> mittlerweile entfernt wurde: Personen, die an diesem Ort wohnen, Personen, die
> diesen Ort besuchen, oder Personen, die kürzlich an diesem Ort waren."

Meta hat das Dropdown mit den vier Standort-Verhalten abgeschafft. Übrig ist die
Sammel-Option **„Leben in oder kürzlich in diesem Ort"** (API:
`location_types: ["home","recent"]`). Laufende Anzeigengruppen bleiben
unangetastet, aber beim Duplizieren validiert Meta neu und lehnt ab.

**Fix in der Oberfläche (2 Klicks):** Anzeigengruppe → *Zielgruppe* → *Standorte* →
„Deutschland" **entfernen** und **neu hinzufügen**. Damit schreibt Ads Manager die
aktuelle Sammel-Option.

**Nicht per API reparieren wollen.** Ein unveröffentlichter Entwurf ist über die
API gar nicht sichtbar, und schickt man `geo_locations` ohne `location_types`,
normalisiert Meta stillschweigend auf `["home"]` — also auf eine der *entfernten*
Einzeloptionen, was die Zielgruppe zusätzlich einengt.

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

14 Tage kostenlos testen. 49 €/Monat inkl. MwSt., monatlich kündbar.
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

### Ziel-URL (alle fünf Karten, nur `utm_content` unterscheidet sich)

```
https://trichterwerk.de/register?utm_source=meta&utm_medium=paid_feed&utm_campaign=preisanker_carousel&utm_content=card1
```

`card1` … `card5` je Karte — damit ist auswertbar, welche Slide den Klick
gebracht hat.

**Call-to-Action:** „Registrieren" (`SIGN_UP`)

Auf `/register` statt auf die Startseite, weil die Slides den Trial bereits
verkauft haben — ein zusätzlicher Zwischenschritt kostet nur Conversions. Beim
ersten Aufsetzen ist genau das verlorengegangen: alle Karten zeigten auf `/`,
eine 14.800 px hohe Seite, und nur 1,1 % der Besucher kamen bis zum Formular.

„Mehr dazu" verspricht Information, nicht ein Formular — deshalb „Registrieren".

`utm_source=meta` statt `instagram`, weil Advantage+ auch auf Facebook ausspielt
(belegt: 51 der 150 Klicks kamen von `m.facebook.com`). `utm_medium=paid_feed`
trennt die bezahlte Ausspielung von `social` (organisch) und `paid_story`
(Story-Ads). So bleiben die Quellen im Admin-Dashboard unterscheidbar.

---

## 4 · Vor dem Aktivieren prüfen

- [ ] Reihenfolge 1–5, „beste Karte zuerst" **aus**
- [ ] Alle fünf Karten zeigen auf dieselbe URL **mit** UTM
- [ ] Pixel „Trichterwerk PIXEL" ausgewählt
- [ ] Vorschau für **Instagram Feed** *und* **Facebook Feed** angesehen
- [ ] Platzierungen automatisch
- [ ] Sonderkategorie leer

Zum Tracking — hier stand vorher, `PageView` und `CompleteRegistration` seien
„live und verifiziert". Das war zu optimistisch: Beide feuern erst **nach**
Marketing-Einwilligung, und der Cookie-Banner war ein Vollbild-Blocker, den kaum
jemand beantwortet hat. Ergebnis: **0 Pixel-Events** über die gesamte
Kampagnenlaufzeit.

Verlasse dich für die Bewertung deshalb nicht auf den Pixel, sondern auf den
Funnel-Report unter *Admin → Plattform-Statistik*. Der läuft cookielos und
consent-unabhängig, sieht also alle Besucher. Der Pixel bleibt nützlich für
Metas Auslieferung — als Erfolgsmessung ist er blind, solange die
Einwilligungsquote niedrig ist (die steht jetzt ebenfalls im Report).

---

## Inhaltliche Leitplanken

Aus dem [README](README.md), gelten unverändert:

- **„2.000–5.000 €" als Spanne**, nie als Pauschalaussage über alle Agenturen.
- **„49 €/Monat inkl. MwSt."** muss sichtbar bleiben — die Preise sind netto und
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

**Gemessene Ausgangswerte (24.–27.07., 32 € Budget)** — als Vergleichsmaßstab:
CTR **3,55 %**, CPC **0,15 €**, 158 Landingpage-Aufrufe, 175 eindeutige Besucher.
Die Anzeige war also nicht das Problem, die Zustellung war es.

| Beobachtung | Bedeutung | Reaktion |
|---|---|---|
| CTR < 0,5 % | Hook zieht nicht | Slide 1 tauschen, nicht die Zielgruppe |
| CTR ok, keine Registrierungen | Landingpage bricht ab | `/register` prüfen, nicht die Anzeige |
| CPC > 1,50 € | Zielgruppe zu teuer | Alter auf 30–50 verengen |
| Frequenz > 2,5 | Zielgruppe ausgereizt | Creative wechseln |

Läuft es an, ist die naheliegende zweite Anzeigengruppe ein **Retargeting** auf
Website-Besucher der letzten 30 Tage — dafür sammelt der Pixel ab jetzt die Daten.
