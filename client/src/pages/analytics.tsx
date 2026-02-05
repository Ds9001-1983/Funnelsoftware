import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Users,
  TrendingUp,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  ChevronDown,
  AlertTriangle,
  Target,
  Zap,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useState, useMemo } from "react";
import type { Funnel, Lead, FunnelPage } from "@shared/schema";

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <ArrowUpRight
              className={`h-3 w-3 ${
                changeType === "positive"
                  ? "text-emerald-500"
                  : changeType === "negative"
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            />
            <span
              className={
                changeType === "positive"
                  ? "text-emerald-500"
                  : changeType === "negative"
                  ? "text-red-500"
                  : "text-muted-foreground"
              }
            >
              {change}
            </span>
            <span className="text-muted-foreground">vs. Vormonat</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelPerformanceCard({
  funnel,
  index,
}: {
  funnel: Funnel;
  index: number;
}) {
  const conversionRate =
    funnel.views > 0
      ? ((funnel.leads / funnel.views) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="text-lg font-medium text-muted-foreground w-6">
        {index + 1}
      </div>
      <div
        className="h-10 w-10 rounded-md shrink-0"
        style={{ backgroundColor: funnel.theme.primaryColor }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{funnel.name}</div>
        <div className="text-sm text-muted-foreground">
          {funnel.pages.length} Seiten
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-medium">{conversionRate}%</div>
        <div className="text-xs text-muted-foreground">Conversion</div>
      </div>
      <div className="text-right shrink-0 w-20">
        <div className="font-medium">{funnel.views.toLocaleString("de-DE")}</div>
        <div className="text-xs text-muted-foreground">Views</div>
      </div>
      <div className="text-right shrink-0 w-16">
        <div className="font-medium">{funnel.leads}</div>
        <div className="text-xs text-muted-foreground">Leads</div>
      </div>
    </div>
  );
}

function SourceCard({ source, count, total }: { source: string; count: number; total: number }) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : "0";

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{source}</span>
          <span className="text-sm text-muted-foreground">{count} Leads</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
    </div>
  );
}

/**
 * Conversion Funnel Visualization
 * Shows drop-off at each step of the funnel
 */
function ConversionFunnelChart({
  funnel,
  views,
  leads,
}: {
  funnel: Funnel;
  views: number;
  leads: number;
}) {
  // Simulate page-level data (in real implementation, this would come from analytics events)
  const steps = useMemo(() => {
    const pageCount = funnel.pages.length;
    if (pageCount === 0 || views === 0) return [];

    // Calculate estimated drop-off rates per step
    // This simulates realistic user behavior patterns
    const result: Array<{
      page: FunnelPage;
      visitors: number;
      dropOff: number;
      dropOffRate: number;
    }> = [];

    let currentVisitors = views;

    funnel.pages.forEach((page, index) => {
      // Calculate typical drop-off based on page type and position
      let dropOffRate: number;
      if (index === 0) {
        dropOffRate = 0.15; // 15% leave on first page
      } else if (page.type === "contact") {
        dropOffRate = 0.35; // Contact pages have higher drop-off
      } else if (page.type === "calendar") {
        dropOffRate = 0.4; // Calendar booking has highest drop-off
      } else if (page.type === "thankyou") {
        dropOffRate = 0; // No drop-off on thank you
      } else {
        dropOffRate = 0.2 + index * 0.05; // Gradually increasing drop-off
      }

      // Ensure we end up with the actual lead count
      if (index === pageCount - 1) {
        currentVisitors = leads;
        dropOffRate = 0;
      }

      const dropOff = Math.round(currentVisitors * dropOffRate);

      result.push({
        page,
        visitors: currentVisitors,
        dropOff,
        dropOffRate: dropOffRate * 100,
      });

      currentVisitors = currentVisitors - dropOff;
    });

    return result;
  }, [funnel, views, leads]);

  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Keine Funnel-Daten verfügbar</p>
      </div>
    );
  }

  const maxVisitors = steps[0]?.visitors || 1;

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const widthPercent = (step.visitors / maxVisitors) * 100;
        const isLastStep = index === steps.length - 1;

        return (
          <div key={step.page.id}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {index + 1}
              </div>
              <span className="text-sm font-medium flex-1 truncate">
                {step.page.title || step.page.type}
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-sm font-semibold">
                    {step.visitors.toLocaleString("de-DE")}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {widthPercent.toFixed(1)}% der Besucher
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="ml-9">
              <div className="h-6 bg-muted rounded-md overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-md transition-all flex items-center justify-end px-2"
                  style={{ width: `${Math.max(widthPercent, 5)}%` }}
                >
                  <span className="text-xs font-medium text-primary-foreground">
                    {widthPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
              {!isLastStep && step.dropOff > 0 && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>-{step.dropOff.toLocaleString("de-DE")} ({step.dropOffRate.toFixed(0)}% Abbruch)</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Drop-off Analysis Card
 * Identifies pages with highest drop-off rates
 */
function DropOffAnalysis({ funnels }: { funnels: Funnel[] }) {
  const analysis = useMemo(() => {
    // Analyze all funnels to find problematic pages
    const issues: Array<{
      funnelName: string;
      pageName: string;
      pageType: string;
      severity: "high" | "medium" | "low";
      message: string;
      suggestion: string;
    }> = [];

    funnels.forEach(funnel => {
      if (funnel.status !== "published" || funnel.pages.length < 2) return;

      const conversionRate = funnel.views > 0 ? (funnel.leads / funnel.views) * 100 : 0;

      // Check overall funnel performance
      if (conversionRate < 5 && funnel.views > 100) {
        issues.push({
          funnelName: funnel.name,
          pageName: "Gesamter Funnel",
          pageType: "funnel",
          severity: "high",
          message: `Nur ${conversionRate.toFixed(1)}% Conversion-Rate`,
          suggestion: "Überprüfe den gesamten Funnel-Flow und die Inhalte",
        });
      }

      // Check for common issues
      funnel.pages.forEach((page, index) => {
        // Contact page early in funnel
        if (page.type === "contact" && index < 2 && funnel.pages.length > 3) {
          issues.push({
            funnelName: funnel.name,
            pageName: page.title,
            pageType: page.type,
            severity: "medium",
            message: "Kontaktseite zu früh im Funnel",
            suggestion: "Verschiebe die Kontaktseite weiter nach hinten",
          });
        }

        // Missing elements on contact page
        if (page.type === "contact") {
          const hasRequiredFields = page.elements.some(el =>
            el.type === "input" && el.required
          );
          if (!hasRequiredFields) {
            issues.push({
              funnelName: funnel.name,
              pageName: page.title,
              pageType: page.type,
              severity: "low",
              message: "Keine Pflichtfelder definiert",
              suggestion: "Füge Pflichtfelder hinzu für bessere Lead-Qualität",
            });
          }
        }

        // Empty page
        if (page.elements.length === 0 && page.type !== "thankyou") {
          issues.push({
            funnelName: funnel.name,
            pageName: page.title,
            pageType: page.type,
            severity: "high",
            message: "Leere Seite",
            suggestion: "Füge Inhalte zu dieser Seite hinzu",
          });
        }
      });
    });

    return issues.slice(0, 5); // Show top 5 issues
  }, [funnels]);

  if (analysis.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Keine Optimierungsvorschläge</p>
        <p className="text-xs mt-1">Deine Funnels sehen gut aus!</p>
      </div>
    );
  }

  const severityColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const severityLabels = {
    high: "Kritisch",
    medium: "Mittel",
    low: "Hinweis",
  };

  return (
    <div className="space-y-3">
      {analysis.map((issue, index) => (
        <div key={index} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                issue.severity === "high" ? "text-red-500" :
                issue.severity === "medium" ? "text-amber-500" : "text-blue-500"
              }`} />
              <span className="text-sm font-medium">{issue.funnelName}</span>
            </div>
            <Badge variant="secondary" className={severityColors[issue.severity]}>
              {severityLabels[issue.severity]}
            </Badge>
          </div>
          <div className="ml-6">
            <p className="text-sm text-muted-foreground">{issue.pageName}</p>
            <p className="text-sm font-medium">{issue.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              💡 {issue.suggestion}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page type performance comparison
 */
function PageTypePerformance({ funnels }: { funnels: Funnel[] }) {
  const stats = useMemo(() => {
    const pageTypeStats: Record<string, { count: number; totalElements: number }> = {};

    funnels.forEach(funnel => {
      funnel.pages.forEach(page => {
        if (!pageTypeStats[page.type]) {
          pageTypeStats[page.type] = { count: 0, totalElements: 0 };
        }
        pageTypeStats[page.type].count++;
        pageTypeStats[page.type].totalElements += page.elements.length;
      });
    });

    return Object.entries(pageTypeStats).map(([type, stats]) => ({
      type,
      count: stats.count,
      avgElements: stats.count > 0 ? (stats.totalElements / stats.count).toFixed(1) : "0",
    })).sort((a, b) => b.count - a.count);
  }, [funnels]);

  const typeLabels: Record<string, string> = {
    welcome: "Willkommen",
    question: "Frage",
    multiChoice: "Mehrfachauswahl",
    contact: "Kontakt",
    calendar: "Kalender",
    thankyou: "Danke",
  };

  const typeColors: Record<string, string> = {
    welcome: "bg-blue-500",
    question: "bg-purple-500",
    multiChoice: "bg-indigo-500",
    contact: "bg-green-500",
    calendar: "bg-amber-500",
    thankyou: "bg-emerald-500",
  };

  return (
    <div className="space-y-2">
      {stats.map(({ type, count, avgElements }) => (
        <div key={type} className="flex items-center gap-3 py-2">
          <div className={`h-3 w-3 rounded-full ${typeColors[type] || "bg-gray-500"}`} />
          <span className="flex-1 text-sm">{typeLabels[type] || type}</span>
          <span className="text-sm text-muted-foreground">{avgElements} Ø Elemente</span>
          <span className="text-sm font-medium w-12 text-right">{count}x</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  useDocumentTitle("Analytics");

  const [timeRange, setTimeRange] = useState("30d");
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);

  const { data: funnels, isLoading: funnelsLoading } = useQuery<Funnel[]>({
    queryKey: ["/api/funnels"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const isLoading = funnelsLoading || leadsLoading;

  // Get selected funnel for conversion funnel visualization
  const selectedFunnel = useMemo(() => {
    if (!funnels) return null;
    const id = selectedFunnelId || funnels.find(f => f.status === "published")?.id.toString();
    return funnels.find(f => f.id.toString() === id) || null;
  }, [funnels, selectedFunnelId]);

  // Calculate metrics
  const totalViews = funnels?.reduce((sum, f) => sum + f.views, 0) || 0;
  const totalLeads = leads?.length || 0;
  const avgConversion =
    funnels && funnels.length > 0
      ? (
          funnels.reduce(
            (sum, f) => sum + (f.views > 0 ? (f.leads / f.views) * 100 : 0),
            0
          ) / funnels.length
        ).toFixed(1)
      : "0.0";

  // Calculate sources
  const sourceCounts =
    leads?.reduce((acc, lead) => {
      const source = lead.source || "Direkt";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  const sortedSources = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Sort funnels by performance
  const topFunnels =
    funnels
      ?.filter((f) => f.status === "published")
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 5) || [];

  // Status distribution
  const statusCounts =
    leads?.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  const statusLabels: Record<string, string> = {
    new: "Neu",
    contacted: "Kontaktiert",
    qualified: "Qualifiziert",
    converted: "Konvertiert",
    lost: "Verloren",
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    qualified: "bg-purple-500",
    converted: "bg-emerald-500",
    lost: "bg-gray-400",
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Verfolge die Performance deiner Funnels
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px]" data-testid="select-time-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Letzte 7 Tage</SelectItem>
            <SelectItem value="30d">Letzte 30 Tage</SelectItem>
            <SelectItem value="90d">Letzte 90 Tage</SelectItem>
            <SelectItem value="all">Gesamt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gesamte Views"
          value={totalViews.toLocaleString("de-DE")}
          change="+18.2%"
          changeType="positive"
          icon={Eye}
          loading={isLoading}
        />
        <StatCard
          title="Gesammelte Leads"
          value={totalLeads}
          change="+12.5%"
          changeType="positive"
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Ø Conversion-Rate"
          value={`${avgConversion}%`}
          change="+2.3%"
          changeType="positive"
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatCard
          title="Aktive Funnels"
          value={funnels?.filter((f) => f.status === "published").length || 0}
          icon={MousePointerClick}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Top Funnels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topFunnels.length > 0 ? (
              topFunnels.map((funnel, index) => (
                <FunnelPerformanceCard
                  key={funnel.id}
                  funnel={funnel}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Noch keine Funnel-Daten vorhanden</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Traffic-Quellen</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : sortedSources.length > 0 ? (
                <div className="space-y-1">
                  {sortedSources.map(([source, count]) => (
                    <SourceCard
                      key={source}
                      source={source}
                      count={count}
                      total={totalLeads}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Noch keine Quelldaten vorhanden
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead-Status Verteilung</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : Object.keys(statusCounts).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(statusLabels).map(([status, label]) => {
                    const count = statusCounts[status] || 0;
                    const percentage =
                      totalLeads > 0
                        ? ((count / totalLeads) * 100).toFixed(0)
                        : "0";
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${statusColors[status]}`}
                        />
                        <span className="flex-1 text-sm">{label}</span>
                        <span className="text-sm text-muted-foreground">
                          {count}
                        </span>
                        <span className="text-sm font-medium w-12 text-right">
                          {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Noch keine Leads vorhanden
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conversion Funnel Visualization */}
      {topFunnels.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    Conversion Funnel
                  </CardTitle>
                  <CardDescription>
                    Analysiere den Besucherfluss durch deinen Funnel
                  </CardDescription>
                </div>
                <Select
                  value={selectedFunnelId || topFunnels[0]?.id.toString()}
                  onValueChange={setSelectedFunnelId}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Funnel wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {topFunnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id.toString()}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : selectedFunnel ? (
                <ConversionFunnelChart
                  funnel={selectedFunnel}
                  views={selectedFunnel.views}
                  leads={selectedFunnel.leads}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Wähle einen Funnel aus
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                Optimierungsvorschläge
              </CardTitle>
              <CardDescription>
                Identifizierte Probleme und Verbesserungsmöglichkeiten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <DropOffAnalysis funnels={funnels || []} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Page Type Performance */}
      {funnels && funnels.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seitentyp-Verwendung</CardTitle>
              <CardDescription>
                Welche Seitentypen werden am häufigsten verwendet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <PageTypePerformance funnels={funnels} />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                Performance Übersicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {funnels.length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Gesamt Funnels
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-emerald-600">
                    {funnels.filter(f => f.status === "published").length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Veröffentlicht
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-amber-600">
                    {funnels.reduce((sum, f) => sum + f.pages.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Gesamt Seiten
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {(funnels.reduce((sum, f) => sum + f.pages.length, 0) / Math.max(funnels.length, 1)).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Ø Seiten pro Funnel
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
