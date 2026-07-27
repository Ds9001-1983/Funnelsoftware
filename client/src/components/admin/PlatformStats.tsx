import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Eye, UserPlus, TrendingUp } from "lucide-react";

interface PlatformStatsData {
  days: number;
  totals: { visitors: number; pageviews: number; registrations: number };
  funnel: {
    landingViewed: number;
    ctaClicked: number;
    registerViewed: number;
    formStarted: number;
    accountCreated: number;
    trialStarted: number;
    purchased: number;
  };
  consent: { accepted: number; rejected: number };
  visitorsByDay: { day: string; visitors: number; pageviews: number }[];
  topPaths: { path: string; count: number }[];
  topReferrers: { host: string; count: number }[];
  topUtmSources: { source: string; count: number }[];
  ctaBreakdown: { label: string; count: number }[];
  byDevice: { device: string; visitors: number; registrations: number }[];
}

const CTA_LABELS: Record<string, string> = {
  hero: "Hero (oben)",
  pricing: "Preisliste",
  final: "Abschluss (unten)",
  unbekannt: "ohne Zuordnung",
};

const RANGES = [7, 30, 90] as const;

/**
 * Betreiber-Übersicht der cookieless Reichweitenmessung für trichterwerk.de:
 * Besucher, Seitenaufrufe, Registrierungen, Conversion, Verlauf und Top-Quellen.
 */
export function PlatformStats() {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useQuery<PlatformStatsData>({
    queryKey: ["/api/admin/platform-stats", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/platform-stats?days=${days}`);
      if (!res.ok) throw new Error("Plattform-Statistik konnte nicht geladen werden");
      return res.json();
    },
  });

  const totals = data?.totals ?? { visitors: 0, pageviews: 0, registrations: 0 };
  const convRate = totals.visitors > 0 ? (totals.registrations / totals.visitors) * 100 : 0;
  const byDay = data?.visitorsByDay ?? [];
  const maxDay = Math.max(1, ...byDay.map((d) => d.visitors));

  const f = data?.funnel;
  const funnelSteps = [
    { key: "landingViewed", label: "Startseite gesehen", value: f?.landingViewed ?? 0 },
    { key: "ctaClicked", label: "CTA geklickt", value: f?.ctaClicked ?? 0 },
    { key: "registerViewed", label: "Formular gesehen", value: f?.registerViewed ?? 0 },
    { key: "formStarted", label: "Formular begonnen", value: f?.formStarted ?? 0 },
    { key: "accountCreated", label: "Account erstellt", value: f?.accountCreated ?? 0 },
    { key: "trialStarted", label: "Trial mit Karte", value: f?.trialStarted ?? 0 },
    { key: "purchased", label: "Bezahlt", value: f?.purchased ?? 0 },
  ];
  const funnelTop = funnelSteps[0].value;
  const consentTotal = (data?.consent.accepted ?? 0) + (data?.consent.rejected ?? 0);
  const consentRate = consentTotal > 0 ? ((data?.consent.accepted ?? 0) / consentTotal) * 100 : 0;

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          Plattform-Reichweite <span className="text-xs font-normal text-muted-foreground">(cookieless, DSGVO-konform)</span>
        </CardTitle>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button key={r} size="sm" variant={days === r ? "default" : "outline"} onClick={() => setDays(r)}>
              {r} Tage
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi icon={<Eye className="h-4 w-4" />} label="Besucher" value={totals.visitors} />
              <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Seitenaufrufe" value={totals.pageviews} />
              <Kpi icon={<UserPlus className="h-4 w-4" />} label="Registrierungen" value={totals.registrations} />
              <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Conversion" value={`${convRate.toFixed(1)} %`} />
            </div>

            {totals.visitors === 0 && (
              <p className="text-sm text-muted-foreground">
                Noch keine Besucher im Zeitraum erfasst. Sobald Traffic auf trichterwerk.de kommt
                (organisch oder über Ads), erscheint er hier — ohne Cookies, ohne Einwilligungsbanner.
              </p>
            )}

            {/*
              Der Funnel — die Auswertung, die bei der ersten Meta-Kampagne
              gefehlt hat. Sichtbar waren nur „Besucher" und „Registrierungen";
              die Stufe dazwischen, auf der 98 % verloren gingen, war unsichtbar.
            */}
            {funnelSteps.some((s) => s.value > 0) && (
              <div>
                <p className="text-sm font-medium mb-3">Funnel</p>
                <div className="space-y-1.5">
                  {funnelSteps.map((step, i) => {
                    const prev = i === 0 ? null : funnelSteps[i - 1].value;
                    const drop = prev && prev > 0 ? 100 - (step.value / prev) * 100 : null;
                    const width = funnelTop > 0 ? (step.value / funnelTop) * 100 : 0;
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-xs text-muted-foreground">{step.label}</span>
                        <div className="flex-1 h-6 rounded bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary/70 rounded min-w-[2px]"
                            style={{ width: `${Math.max(width, step.value > 0 ? 1 : 0)}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums">
                          {step.value}
                        </span>
                        <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                          {drop === null ? "" : `−${drop.toFixed(0)} %`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Eindeutige Besucher je Stufe. „Account erstellt" und alles darunter
                  entsteht serverseitig und ist von außen nicht manipulierbar.
                </p>
              </div>
            )}

            {/*
              Einwilligungsquote: sagt, welchen Anteil der Besucher der Meta-Pixel
              überhaupt sehen kann. Ohne diese Zahl ist jede Pixel-Statistik
              unlesbar — bei der ersten Kampagne waren es 0 von 175.
            */}
            {consentTotal > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">
                  Marketing-Einwilligung: {consentRate.toFixed(0)} %
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data?.consent.accepted ?? 0} von {consentTotal} Entscheidungen. Nur
                  diesen Anteil der Besucher sieht der Meta-Pixel — die Zahlen oben
                  sind cookielos und sehen alle.
                </p>
              </div>
            )}

            {byDay.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Besucher pro Tag</p>
                <div className="flex items-end gap-1 h-32">
                  {byDay.map((d) => (
                    <div
                      key={d.day}
                      className="flex-1 flex flex-col items-center justify-end gap-1"
                      title={`${d.day}: ${d.visitors} Besucher, ${d.pageviews} Aufrufe`}
                    >
                      <div
                        className="w-full bg-primary/70 rounded-t min-h-[2px]"
                        style={{ height: `${(d.visitors / maxDay) * 100}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <TopList title="Top-Seiten" rows={(data?.topPaths ?? []).map((p) => ({ label: p.path, count: p.count }))} />
              <TopList
                title="Top-Herkunft (Referrer)"
                rows={(data?.topReferrers ?? []).map((r) => ({ label: r.host, count: r.count }))}
                empty="direkt / keine Referrer"
              />
              <TopList
                title="Top-Kampagnen (UTM)"
                rows={(data?.topUtmSources ?? []).map((u) => ({ label: u.source, count: u.count }))}
                empty="keine UTM-Quellen"
              />
              <TopList
                title="Welcher CTA trägt"
                rows={(data?.ctaBreakdown ?? []).map((c) => ({
                  label: CTA_LABELS[c.label] ?? c.label,
                  count: c.count,
                }))}
                empty="noch keine CTA-Klicks"
              />
              <TopList
                title="Gerät (Besucher / Registrierungen)"
                rows={(data?.byDevice ?? []).map((d) => ({
                  label: `${d.device} — ${d.registrations} Reg.`,
                  count: d.visitors,
                }))}
                empty="keine Geräte-Daten"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function TopList({
  title,
  rows,
  empty = "keine Daten",
}: {
  title: string;
  rows: { label: string; count: number }[];
  empty?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-muted-foreground">{r.label}</span>
              <span className="font-medium tabular-nums">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
