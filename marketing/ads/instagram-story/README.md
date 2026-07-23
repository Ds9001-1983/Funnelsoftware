# Instagram-Story-Anzeigen — „Speed" (Juli 2026)

Erste Werbe-Creatives für Trichterwerk. Angle: **Speed** („Dein Funnel. Live in unter 1 Stunde."), Zielgruppe breit (Coaches, Berater, Dienstleister, Recruiter). Format: 9:16 (1080×1920). Setup-Empfehlungen basieren auf einer Recherche der Best-Practice-Lage 2025/2026 (Meta-Guidelines, Motion/Socialinsider/Metricool-Benchmarks, Bitkom, DACH-Quellen) — Stand Juli 2026.

## Dateien

| Datei | Was | Einsatz |
|---|---|---|
| `story-speed-v1.png` | **Haupt-Creative** (Dark Glow, statisch) | Erste Kampagne |
| `story-speed-v1.mp4` | Video (10 s, Hook-first: Headline ab Frame 1, alles Wesentliche < 4,5 s; H.264, ohne Ton, sound-off-lesbar) | Parallel zum Bild |
| `story-screenrec-v1.mp4` | **Screen-Recording-Video** (14,3 s): echter App-Mitschnitt Vorlage→Editor→„Dein Funnel ist jetzt live!" in 3 Schritten, Dark-Glow-Rahmen, Endcard | Cold-Traffic, nativer Look |
| `story-text-static.png` | **Simple Text-Static** (Preis-Anker: Agentur 3.000 € vs. 49 €/Monat) | Höchste Win-Rate-Kategorie |
| `story-speed-alt-hell.png` | Alternative: helles Editorial-Design | Creative-Diversifikation |
| `story-speed-alt-violett.png` | Alternative: Violett-Bold-Design | Creative-Diversifikation |
| `quellen/*` | HTML-Quellen + Aufnahme-Script | Anpassungen (siehe unten) |

Alle Creatives: Meta-Safe-Zones eingehalten (oben ~250 px / unten ~340 px, kritischer Inhalt im Band bis ~1250 px), echte Produkt-Screenshots (Template „Termin buchen"), Duz-Ansprache, DSGVO/Made-in-Germany nur als Badge (nicht als Hook), Textmenge plakativ statt Textwüste.

## Meta Ads Manager — Setup (nach 2026er-Datenlage)

- **Platzierung: Advantage+ Placements** (automatisch), das 9:16-Asset wird dabei für Stories/Reels ausgeliefert — automatische Platzierungen sind ~10–20 % kosteneffizienter; bei effizienten Accounts läuft nur 10–20 % des Spends in Stories. Stories-only höchstens als bewusstes Kontroll-Experiment. Für Feed-Platzierungen später 1:1/4:5-Zuschnitte ergänzen (Placement Asset Customization).
- **Kampagnenziel:** Sales/Conversions auf `CompleteRegistration` (Pixel + CAPI sind live). Ad-Sets konsolidieren, nicht fragmentieren. Richtwert für stabiles Lernen: ~50 Conversions/Woche — solange darunter, kein vorschnelles Umbauen; kein Traffic-Objective als Dauerlösung.
- **Targeting-Start: Interessen-Targeting** (Coaching, Online-Marketing, Lead-Generierung, Recruiting, Geschäftsführung), NICHT sofort Broad — Broad/Advantage+-Audience schlägt Interest-Stacks erst ab ~50 Conversions/Woche und ~30 €+/Tag pro Ad-Set. Übergang zu Broad mit wachsendem Volumen.
- **Beide Formate parallel** im selben Ad Set (Bild + Video), Meta entscheiden lassen — die Datenlage zum CPA-Sieger ist widersprüchlich (Meta: Video −34,5 % Cost/Result; andere Benchmarks: Statics −28 % CPA). Kein Format vorab abschreiben.
- **CTA-Button:** „Jetzt registrieren" (alternativ „Mehr dazu").
- **Ziel-URL** (Variante im `utm_content` anpassen):
  ```
  https://trichterwerk.de/register?utm_source=instagram&utm_medium=paid_story&utm_campaign=story_speed&utm_content=v1-dark-bild
  ```
  `v1-dark-bild` · `v1-dark-video` · `alt-hell` · `alt-violett`
- **Sound:** Im Ads Manager Musik hinzufügen (Meta-eigene Bibliothek) — Sound-on-Design bringt laut Meta bis zu +13 % inkrementelle Conversions; die Kernbotschaft bleibt über Text-Overlays auch stumm vollständig (30–50 % schauen ohne Ton).
- **Primärtext:**
  > Funnels, die verkaufen — ohne Code, ohne Agentur. Baue deinen ersten Funnel in unter 1 Stunde. DSGVO-konform, Hosting in der EU. 14 Tage kostenlos testen.
- **Budget & Geduld:** Realistischer DACH-Einstieg 1.000–1.500 €/Monat (~35–50 €/Tag). Ads mindestens 7 Tage laufen lassen, nicht vor Tag 3 pausieren.
- **KPI-Leitplanken:** Hook Rate (3s-Views/Impressions) ≥ 25 % nach ~1.000 Impressions, sonst Hook tauschen. Stories-CTR realistisch 0,33–0,75 % (nicht am Feed messen). CPL-Korridor B2B-DACH: ~26–60 €. Eigenen Korridor nach 2–4 Wochen Live-Daten festlegen.

## Creative-Roadmap (wichtigste Lücke zuerst)

Die Datenlage 2026 sagt klar: **Meta wählt das Gewinner-Creative, nicht der Advertiser** (nur ~6 % aller Ads bekommen die Mehrheit des Spends). Deshalb 3–5 deutlich unterschiedliche Varianten (< 40 % Ähnlichkeit) einliefern:

1. **Founder-Video (höchste Priorität, braucht Dennis):** 15–30 s Selfie-Talking-Head, direkt in die Kamera („Ich habe Trichterwerk gebaut, weil Agenturen 3.000 € für einen Funnel nehmen…"). UGC-/Lo-fi-Stil bringt in Kaltakquise +31 % Hook-Rate/+33 % CTR vs. poliert; B2B-Founder-Ads ~40 % mehr Engagement als Motion-Graphics. Echtes Gesicht, kein AI-Avatar (Meta labelt AI-Personen seit 03/2026 sichtbar; echte Menschen konvertieren in High-Consideration besser).
2. ~~Screen-Recording-Video~~ ✅ erledigt → `story-screenrec-v1.mp4` (echter App-Mitschnitt via Playwright gegen die lokale E2E-Instanz).
3. ~~Simple Text-Static~~ ✅ erledigt → `story-text-static.png`.
4. Die vorhandenen Alt-Designs (`alt-hell`, `alt-violett`) als weitere Stil-Varianten.

**UTM-Zusätze für die neuen Varianten:** `utm_content=screenrec-video` bzw. `utm_content=text-static`.

**Creative-Fatigue:** Nach 2–3 Wochen Refresh einplanen (Hooks tauschen reicht oft).

## Creatives anpassen / neu rendern

HTML-Quellen in `quellen/` referenzieren Fonts/Screenshots über absolute lokale Pfade (Repo + node_modules) — rendern nur auf diesem Rechner. Statik: Playwright-Screenshot bei Viewport 1080×1920. Video: `quellen/story-speed-v1-video.html` stellt `window.seek(t)` bereit; Frames in 1/30-s-Schritten screenshotten, dann:

```bash
ffmpeg -framerate 30 -i f%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart out.mp4
```

Copy-Bausteine stammen 1:1 von der Landingpage (`client/src/pages/landing.tsx`).
