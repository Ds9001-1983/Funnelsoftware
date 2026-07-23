# Social-Media-Asset-Paket — Trichterwerk (Juli 2026)

Fertige Profil- und Cover-Grafiken im Brand-Design (Violett #7C3AED, Inter, Trichter-Glyphe). Maße wurden im Juli 2026 gegen die **offiziellen Hilfeseiten** recherchiert (Meta, LinkedIn, X, YouTube) und per Doppel-Recherche abgeglichen.

## Dateien & wohin sie gehören

| Datei | Plattform → Verwendung | Maß | Hinweis |
|---|---|---|---|
| `profilbild-1080.png` | **Facebook-Seite + Instagram** Profilbild | 1080×1080 | Wird rund gecroppt — Glyphe sitzt mittig mit genug Rand. FB zeigt 176/196 px, IG ~110–150 px |
| `facebook-titelbild-1640x924.png` | **Facebook-Seite** Titelbild | 1640×924 (= 820×462 @2x) | Kerninhalt liegt in der zentralen Safe-Zone (640×312 @1x) → auf Desktop (820×312) **und** Mobil (640×360) voll sichtbar |
| `linkedin-logo-400.png` | **LinkedIn-Unternehmensseite** Logo | 400×400 | Offizielle Empfehlung; wird eckig mit runden Ecken gezeigt |
| `linkedin-cover-4200x700.png` | **LinkedIn-Unternehmensseite** Titelbild | 4200×700 | Neue offizielle Empfehlung (nicht mehr 1128×191!). Inhalt mittig/rechts — links bleibt Platz fürs Logo-Overlay, Mobil-Crop berücksichtigt |
| `x-profilbild-400.png` | **X/Twitter** Profilbild | 400×400 | Offizielles Maß, max. 2 MB |
| `x-header-1500x500.png` | **X/Twitter** Header | 1500×500 | Oben/unten je ~70 px Puffer, links unten Platz fürs Avatar-Overlay |
| `youtube-profilbild-800.png` | **YouTube** Kanalbild | 800×800 | Wird rund gezeigt (~98 px) |
| `youtube-banner-2560x1440.png` | **YouTube** Kanal-Banner | 2560×1440 | Text komplett in der Geräte-Safe-Area (zentrale 1546×423) — am Handy sieht man NUR diesen Streifen |
| `quellen/*.html` | HTML-Quellen aller Assets | — | Zum Anpassen; rendern mit `shot2.cjs`-Pipeline (siehe unten) |

## Maß-Referenz (recherchiert 07/2026, offizielle Quellen)

**Facebook-Seite**
- Profilbild: Upload ≥ 320×320, empfohlen ≥ 720; Anzeige 176 px (Desktop) / 196 px (Mobil), rund
- Titelbild: rendert 820×312 (Desktop) / 640×360 (Mobil) → **nur die zentrale 640×312-Fläche ist überall sichtbar**; Uploads < 400×150 werden abgelehnt; Tipp: im Ads Manager/Seiten-Editor Vorschau prüfen

**Instagram** (Posts — Ad-Creatives liegen in `marketing/ads/instagram-story/`)
- Profilbild: Upload ~1000×1000, Anzeige rund ~110–150 px
- **Feed-Post neu: 1080×1440 (3:4)** — seit Mai 2025 das einzige Format ohne Beschnitt in Feed **und** Grid (Grid-Kacheln sind seit Jan 2025 3:4!)
- 4:5 (1080×1350): im Grid seitlich ~34 px beschnitten · 1:1 (1080×1080): im Grid ~135 px je Seite beschnitten → für neue Grafiken 3:4 bevorzugen
- Story/Reel: 1080×1920; Reel-Safe-Zone nach Meta-Template: 220 px oben, 420 px unten, 60 px seitlich

**LinkedIn-Unternehmensseite**
- Logo: 400×400 (min. 268×268, max. 3 MB)
- Cover: **4200×700 offiziell empfohlen**; Desktop rendert ~1128×191, Mobil beschneidet seitlich (~zentrale 80 % sichtbar); Logo-Overlay unten links freihalten

**X/Twitter**
- Profilbild 400×400 (max. 2 MB, rund) · Header 1500×500 (max. 5 MB); oben/unten werden je nach Gerät ~40–70 px beschnitten, Avatar ragt unten links hinein

**YouTube**
- Kanalbild 800×800 (Anzeige ~98 px, rund) · Banner 2560×1440 (min. 2048×1152, max. 6 MB); Safe-Area für alle Geräte = zentrale 1546×423 (TV sieht alles, Handy nur diesen Streifen)

## Anpassen / neu rendern

Quellen in `quellen/` (absolute lokale Pfade zu Fonts — rendern nur auf diesem Rechner):

```bash
# Aus dem Repo-Root, absolute Pfade (Playwright lädt die HTML per file://)
node marketing/brand/social/quellen/shot2.cjs \
  "$PWD/marketing/brand/social/quellen/fb-titelbild.html" \
  "$PWD/marketing/brand/social/facebook-titelbild-1640x924.png" 1640 924
```

`shot2.cjs` ist trivial: Playwright-Chromium, Viewport = Zielmaß, `page.screenshot()`. Die Endung **muss** `.cjs` sein — die `package.json` des Projekts setzt `"type": "module"`, als `.js` bricht das Skript mit `require is not defined`. Profilbild-Ableitungen (400/800 px) per `sips -Z <größe> profilbild-1080.png`.
