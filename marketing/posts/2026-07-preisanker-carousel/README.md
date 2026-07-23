# Organischer Feed-Post — „Preis-Anker" (Juli 2026)

Erstes organisches Feed-Posting für Trichterwerk. Angle: **Preis-Anker** (Agentur 2.000–5.000 € vs. 49 €/Monat) — laut der Creative-Recherche in [`../../ads/instagram-story/README.md`](../../ads/instagram-story/README.md) die Kategorie mit der höchsten Win-Rate. Format: 5-Slide-Carousel.

Bis hierher gab es nur Werbe-Creatives im 9:16-Story-Format. Das hier ist Feed-Content für ein Profil, das sonst leer wäre, wenn die Ads Traffic darauf schicken.

## Dateien

| Datei | Was | Einsatz |
|---|---|---|
| `slide-1.png` … `slide-5.png` | **1080×1440 (3:4)** | Instagram-Carousel — das einzige Format ohne Beschnitt in Feed **und** Grid |
| `fb/slide-1.png` … `fb/slide-5.png` | **1080×1350 (4:5)** | Facebook — FB rendert max. 4:5 |
| `quellen/slide-5-fb.html` | Facebook-Variante von Slide 5 | sagt „Link im Beitrag ↓" statt „Link in Bio ↑" — auf Facebook steht der Link klickbar in der Caption |
| `caption-instagram.md` | Caption + Alt-Texte + Kommentar-Vorschlag | Instagram |
| `caption-facebook.md` | Caption in zwei Varianten (A/B, s. u.) | Facebook |
| `quellen/slide-*.html` | HTML-Quellen | Anpassungen (siehe unten) |

Beide Größen stammen aus **denselben** HTML-Dateien: Das Layout ist flex-basiert (`.body { flex:1; justify-content:center }`), die 90 px Höhendifferenz werden vom mittleren Block absorbiert. Schriftgrößen sind in beiden Formaten identisch.

Einzige Ausnahme ist **Slide 5**: `fb/slide-5.png` wird aus `quellen/slide-5-fb.html` gerendert, weil der Hinweis unter dem CTA plattformabhängig ist („Link in Bio" auf Instagram, „Link im Beitrag" auf Facebook). Änderungen an Slide 5 immer in **beide** Quelldateien übernehmen.

## Slide-Dramaturgie

| # | Rolle | Kernaussage |
|---|---|---|
| 1 | Hook | „2.000–5.000 €" durchgestrichen · plus mehrere Wochen Wartezeit · Swipe-Anreiz |
| 2 | Problem | Die vier Stationen eines Agentur-Projekts — und dass jede Änderung danach wieder kostet |
| 3 | Umbruch | 49 € im Monat · nicht ein Funnel, sondern unbegrenzt viele · erster in unter 1 Stunde live |
| 4 | Beweis | Leistungsumfang + echter Produkt-Screenshot (Vorlage „Termin buchen") im Phone-Frame |
| 5 | CTA | 14 Tage kostenlos testen · trichterwerk.de · Trust-Badges |

Slide 1 ist gleichzeitig die **Grid-Kachel** — sie muss ohne die anderen vier funktionieren und tut das.

## Posten

### Instagram (Primärkanal)
1. Alle 5 Slides aus dem Hauptordner **in Reihenfolge 1–5** als Carousel hochladen.
2. Caption aus `caption-instagram.md` übernehmen.
3. Alt-Texte pro Slide hinterlegen (stehen in derselben Datei, „Erweiterte Einstellungen → Alt-Text").
4. **Bio-Link vorher setzen:**
   ```
   https://trichterwerk.de/?utm_source=instagram&utm_medium=social&utm_campaign=preisanker_carousel&utm_content=bio
   ```
5. Optional den vorbereiteten ersten Kommentar direkt nachschieben.

### Facebook — kein organisches Swipe-Carousel

Swipebare Carousels sind auf Facebook ein **Anzeigen**-Format. Ein organischer Mehrbild-Beitrag rendert als Collage, nicht als Carousel. Deshalb zwei Wege:

- **A (empfohlen):** Nur `fb/slide-1.png` als Einzelbild, das komplette Argument in der Caption (Variante A in `caption-facebook.md`). Schlägt die Collage in der Regel.
- **B:** Alle 5 Bilder aus `fb/` als Fotoalbum, kurze Caption (Variante B). Mehr Bildfläche, aber die Slide-Reihenfolge geht in der Collage-Vorschau verloren.

Post-Link (beide Varianten):
```
https://trichterwerk.de/register?utm_source=facebook&utm_medium=social&utm_campaign=preisanker_carousel&utm_content=feed
```

Solange der Feed dünn besetzt ist: Beitrag als Titelbeitrag anpinnen.

## UTM-Schema

Konsistent zum bestehenden Schema der Story-Ads (`utm_campaign=story_speed`). Organisch wird über `utm_medium=social` von `paid_story` getrennt — so lassen sich beide Quellen im Admin-Dashboard sauber auseinanderhalten.

| Kanal | source | medium | campaign | content |
|---|---|---|---|---|
| Instagram (Bio) | `instagram` | `social` | `preisanker_carousel` | `bio` |
| Facebook (Post) | `facebook` | `social` | `preisanker_carousel` | `feed` |

## Inhaltliche Leitplanken (bei Änderungen beibehalten)

- **Agenturpreis als Spanne „2.000–5.000 €"** — exakt die Formulierung der Landingpage ([`client/src/pages/landing.tsx`](../../../client/src/pages/landing.tsx), Hero), nicht als Pauschalaussage über alle Agenturen.
- **„49 €/Monat zzgl. MwSt."** steht auf Slide 3, Slide 5 und in beiden Captions. Alle Preise des Produkts sind netto — auf einem Kanal, der auch Verbraucher erreicht, muss das dran.
- **Keine Wettbewerbernamen.** Der Vergleichs-Table der Landingpage bleibt draußen: vergleichende Werbung ist zulässig, aber prüfpflichtig — im organischen Post unnötiges Risiko.
- **Keine erfundenen Testimonials oder Nutzerzahlen.** Bewusste Linie des Produkts (`proofStats` = belegbare Produktfakten statt Kundenstimmen).
- **„13 fertige Vorlagen"** ist gegen `client/src/lib/templates.ts` gezählt (13 Einträge, keiner `hidden`). Bei Template-Änderungen nachziehen — sonst steht eine falsche Zahl öffentlich im Netz.

## Creatives anpassen / neu rendern

HTML-Quellen in `quellen/` referenzieren Fonts und Produkt-Screenshots über absolute lokale Pfade (Repo + `node_modules`) — sie rendern nur auf diesem Rechner.

```bash
# Aus dem Repo-Root. Instagram (3:4):
node marketing/brand/social/quellen/shot2.cjs \
  "$PWD/marketing/posts/2026-07-preisanker-carousel/quellen/slide-1.html" \
  "$PWD/marketing/posts/2026-07-preisanker-carousel/slide-1.png" 1080 1440

# Facebook (4:5) — dieselbe Quelle, nur andere Höhe:
node marketing/brand/social/quellen/shot2.cjs \
  "$PWD/marketing/posts/2026-07-preisanker-carousel/quellen/slide-1.html" \
  "$PWD/marketing/posts/2026-07-preisanker-carousel/fb/slide-1.png" 1080 1350

# Ausnahme Slide 5 — Facebook nutzt die eigene Quelle:
node marketing/brand/social/quellen/shot2.cjs \
  "$PWD/marketing/posts/2026-07-preisanker-carousel/quellen/slide-5-fb.html" \
  "$PWD/marketing/posts/2026-07-preisanker-carousel/fb/slide-5.png" 1080 1350
```

Das Skript heißt `.cjs`, nicht `.js` — die `package.json` des Projekts setzt `"type": "module"`, als `.js` bricht es mit `require is not defined`.

**Design-Tokens** (übernommen aus `../../ads/instagram-story/quellen/story-speed-v1.html`, damit Feed, Story-Ads und Profilgrafiken zusammenpassen): Basis `#0E0E11`, Violett `#7C3AED` mit Verläufen `#925CF0`→`#5B21B6`, Inter 500/600/700/800, Dot-Grid, Radial-Glow, Pill-Chips.

Bei Textverläufen auf dunklem Grund die hellen Stops verwenden (`#FFFFFF`→`#E6DDFF`→`#B79BF6`) — Verläufe, die in `#7C3AED` auslaufen, verlieren auf `#0E0E11` zu viel Kontrast.

## Recycling

Die 4:5-Renders sind ohne Änderung als **Feed-Anzeigen-Creative** einsetzbar (Placement Asset Customization, siehe Ads-README). Für eine bezahlte Ausspielung dann `utm_medium=paid_feed` statt `social` setzen.

Nächste Content-Lücke laut Creative-Roadmap bleibt das **Founder-Talking-Head-Video** — organisch wie bezahlt der stärkste Hebel und weiterhin offen.
