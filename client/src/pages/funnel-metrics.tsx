import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Eye, Users, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDocumentTitle } from "@/hooks/use-document-title";

interface FunnelMetrics {
  totalViews: number;
  totalLeads: number;
  conversionRate: number;
  stepConversion: Array<{
    pageId: string;
    title: string;
    stepNumber: number;
    visitors: number;
  }>;
  answerDistribution: Array<{
    pageId: string;
    title: string;
    totalResponses: number;
    answers: Array<{ text: string; count: number; percentage: number }>;
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
    leads: number;
  }>;
}

export default function FunnelMetrics() {
  const [, params] = useRoute("/funnels/:id/metrics");
  useDocumentTitle("Metriken");

  const { data: metrics, isLoading } = useQuery<FunnelMetrics>({
    queryKey: ["/api/funnels", params?.id, "metrics"],
    queryFn: async () => {
      const res = await fetch(`/api/funnels/${params?.id}/metrics`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-5"><Skeleton className="h-64" /></CardContent></Card>
      </div>
    );
  }

  if (!metrics) return null;

  const maxVisitors = Math.max(...metrics.stepConversion.map(s => s.visitors), 1);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Metriken</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Besuche</span>
            </div>
            <p className="text-3xl font-bold">{metrics.totalViews.toLocaleString("de-DE")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Neue Conversions</span>
            </div>
            <p className="text-3xl font-bold">{metrics.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Conversion Rate</span>
            </div>
            <p className="text-3xl font-bold">{metrics.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Step-by-Step Conversion (Killer Feature) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Seite-zu-Seite-Konvertierungsrate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.stepConversion.map((step, idx) => {
              const prevVisitors = idx > 0 ? metrics.stepConversion[idx - 1].visitors : step.visitors;
              const dropOff = prevVisitors > 0 ? Math.round(((prevVisitors - step.visitors) / prevVisitors) * 100) : 0;
              const barWidth = maxVisitors > 0 ? (step.visitors / maxVisitors) * 100 : 0;

              return (
                <div key={step.pageId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{step.title}</span>
                      <span className="text-sm text-muted-foreground shrink-0 ml-2">
                        {step.visitors.toLocaleString("de-DE")}
                      </span>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/80 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(barWidth, 2)}%` }}
                      >
                        {barWidth > 15 && (
                          <span className="text-[10px] font-medium text-white">
                            {Math.round(barWidth)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {idx > 0 && dropOff > 0 && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 shrink-0">
                      -{dropOff}%
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Views Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads vs. Besucher (14 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {metrics.viewsOverTime.map((day) => {
              const maxDay = Math.max(...metrics.viewsOverTime.map(d => d.views + d.leads), 1);
              const viewHeight = (day.views / maxDay) * 100;
              const leadHeight = (day.leads / maxDay) * 100;
              const dateLabel = new Date(day.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${dateLabel}: ${day.views} Besuche, ${day.leads} Leads`}>
                  <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                    {day.leads > 0 && (
                      <div
                        className="w-full bg-primary rounded-t-sm"
                        style={{ height: `${Math.max(leadHeight, 3)}%` }}
                      />
                    )}
                    <div
                      className="w-full bg-primary/20 rounded-t-sm"
                      style={{ height: `${Math.max(viewHeight, 1)}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-muted-foreground hidden sm:block">
                    {dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              Besucher
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              Leads
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Distribution per Question */}
      {metrics.answerDistribution.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.answerDistribution.map((question) => (
            <Card key={question.pageId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{question.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {question.totalResponses} von {metrics.totalViews} Besuchern haben geantwortet
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {question.answers.map((answer) => (
                  <div key={answer.text} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm truncate">{answer.text}</span>
                        <span className="text-sm font-medium shrink-0 ml-2">{answer.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${answer.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
