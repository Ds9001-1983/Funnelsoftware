import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  templateCategoryLabels,
  type TemplateMeta,
} from "@shared/template-meta";
import { TEMPLATE_GALLERY_PATH } from "@shared/seo-links";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Dezente Kategorie-Farbwelt hinter der Live-Vorschau (Detailseite) —
 *  Opacity-basierte Tints, damit Light- und Dark-Theme funktionieren. */
export const categoryGlow: Record<TemplateMeta["category"], string> = {
  leads: "from-violet-500/15 via-purple-500/5 to-fuchsia-500/10",
  sales: "from-rose-500/15 via-red-500/5 to-orange-500/10",
  recruiting: "from-emerald-500/15 via-green-500/5 to-teal-500/10",
  webinar: "from-blue-500/15 via-sky-500/5 to-cyan-500/10",
  quiz: "from-green-500/15 via-emerald-500/5 to-lime-500/10",
  survey: "from-sky-500/15 via-blue-500/5 to-indigo-500/10",
};

interface TemplateTileProps {
  meta: TemplateMeta;
}

/**
 * Foto-geführte Galerie-Kachel: Hero-Foto des Templates als ruhiges,
 * einheitliches Kachelbild; bei Hover/Fokus (Desktop) blendet der
 * Funnel-Durchlauf als stummes Kurzvideo ein. Darunter Name,
 * Nutzenversprechen und die beiden CTAs.
 * Touch-Geräte ohne Hover: Tap auf das Bild öffnet die Live-Vorschau —
 * die schlägt jedes Video.
 */
export function TemplateTile({ meta }: TemplateTileProps) {
  const detailPath = `${TEMPLATE_GALLERY_PATH}/${meta.slug}`;
  const hero = `/templates/heroes/${meta.slug}.webp`;

  const [videoActive, setVideoActive] = useState(false);
  const [videoBroken, setVideoBroken] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const canPlayVideo = meta.videoAvailable && !videoBroken && !prefersReducedMotion();

  useEffect(() => {
    if (videoActive) {
      videoRef.current?.play().catch(() => {
        // Autoplay blockiert → Foto bleibt sichtbar
      });
    }
  }, [videoActive]);

  return (
    <div
      className="group flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onMouseEnter={() => canPlayVideo && setVideoActive(true)}
      onMouseLeave={() => {
        videoRef.current?.pause();
        setVideoActive(false);
      }}
      onFocus={() => canPlayVideo && setVideoActive(true)}
      onBlur={() => {
        videoRef.current?.pause();
        setVideoActive(false);
      }}
    >
      <Link
        href={detailPath}
        aria-label={`Live-Vorschau: ${meta.name}`}
        className="relative block aspect-[4/5] overflow-hidden bg-muted"
      >
        <img
          src={hero}
          alt={`Vorschau der Funnel-Vorlage „${meta.name}“`}
          width={900}
          height={1200}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {/* Hover-Video (Funnel-Durchlauf): erst bei Aktivierung eingehängt (preload none),
            hochkant im Letterbox-Container über dem abgedunkelten Foto */}
        {videoActive && (
          <div className="absolute inset-0 bg-gray-950/85 backdrop-blur-sm">
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              onError={() => {
                setVideoBroken(true);
                setVideoActive(false);
              }}
              className="h-full w-full object-contain"
            >
              <source src={`/templates/videos/${meta.slug}.webm`} type="video/webm" />
              <source src={`/templates/videos/${meta.slug}.mp4`} type="video/mp4" />
            </video>
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 bg-background/85 backdrop-blur-sm"
        >
          {templateCategoryLabels[meta.category]}
        </Badge>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold">{meta.name}</h3>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">{meta.benefit}</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Link href={detailPath} className="sm:flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Live-Vorschau
            </Button>
          </Link>
          <Link href={`/register?template=${meta.slug}`} className="sm:flex-1">
            <Button size="sm" className="w-full">
              Mit Template starten
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
