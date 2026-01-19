import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Users,
  TrendingUp,
  MousePointerClick,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useState } from "react";
import type { Funnel, Lead } from "@shared/schema";

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

export default function Analytics() {
  useDocumentTitle("Analytics");

  const [timeRange, setTimeRange] = useState("30d");

  const { data: funnels, isLoading: funnelsLoading } = useQuery<Funnel[]>({
    queryKey: ["/api/funnels"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const isLoading = funnelsLoading || leadsLoading;

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
    </div>
  );
}
