import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
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

interface TemplateTileProps {
  meta: TemplateMeta;
}

/**
 * Galerie-Kachel im Perspective-Stil: Portrait-Poster im Phone-Mockup,
 * automatisch abspielendes stummes Kurzvideo bei Hover/Fokus (Desktop),
 * darunter Kategorie, Name, Nutzenversprechen und die beiden CTAs.
 * Touch-Geräte ohne Hover: Tap auf die Kachel öffnet die Live-Vorschau —
 * die schlägt jedes Video.
 */
export function TemplateTile({ meta }: TemplateTileProps) {
  const detailPath = `${TEMPLATE_GALLERY_PATH}/${meta.slug}`;
  const poster = `/templates/portrait/${meta.slug}.webp`;

  const [videoActive, setVideoActive] = useState(false);
  const [videoBroken, setVideoBroken] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const canPlayVideo = meta.videoAvailable && !videoBroken && !prefersReducedMotion();

  useEffect(() => {
    if (videoActive) {
      videoRef.current?.play().catch(() => {
        // Autoplay blockiert → Poster bleibt sichtbar
      });
    }
  }, [videoActive]);

  return (
    <div
      className="group flex flex-col items-center"
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
        className="block transition-transform duration-300 group-hover:-translate-y-1"
      >
        <PhoneFrame className="w-[240px]" screenClassName="h-[420px]" interactive={false}>
          {/* Poster (erste Funnel-Seite als Portrait-Screenshot) */}
          <picture>
            <source srcSet={poster} type="image/webp" />
            <img
              src={poster.replace(".webp", ".png")}
              alt={`Vorschau der Funnel-Vorlage „${meta.name}“`}
              width={375}
              height={740}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          </picture>
          {/* Hover-Video: wird erst bei Aktivierung eingehängt (preload none) */}
          {videoActive && (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              poster={poster}
              onError={() => {
                setVideoBroken(true);
                setVideoActive(false);
              }}
              className="absolute inset-0 h-full w-full object-cover object-top"
            >
              <source src={`/templates/videos/${meta.slug}.webm`} type="video/webm" />
              <source src={`/templates/videos/${meta.slug}.mp4`} type="video/mp4" />
            </video>
          )}
        </PhoneFrame>
      </Link>

      <div className="mt-5 flex flex-col items-center text-center max-w-[280px]">
        <Badge variant="secondary" className="mb-2">
          {templateCategoryLabels[meta.category]}
        </Badge>
        <h3 className="text-lg font-semibold">{meta.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{meta.benefit}</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full justify-center">
          <Link href={detailPath}>
            <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
              <Play className="h-3.5 w-3.5" />
              Live-Vorschau
            </Button>
          </Link>
          <Link href={`/register?template=${meta.slug}`}>
            <Button size="sm" className="w-full sm:w-auto">
              Mit Template starten
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
