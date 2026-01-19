import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Layers,
  Users,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/use-document-title";
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
  changeType?: "positive" | "negative";
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
            {changeType === "positive" ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={changeType === "positive" ? "text-emerald-500" : "text-red-500"}>
              {change}
            </span>
            <span className="text-muted-foreground">vs. letzte Woche</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelCard({ funnel }: { funnel: Funnel }) {
  const conversionRate = funnel.views > 0 
    ? ((funnel.leads / funnel.views) * 100).toFixed(1) 
    : "0.0";

  return (
    <Card className="hover-elevate cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{funnel.name}</h3>
              <Badge 
                variant={funnel.status === "published" ? "default" : "secondary"}
                className="shrink-0"
              >
                {funnel.status === "published" ? "Live" : funnel.status === "draft" ? "Entwurf" : "Archiviert"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-3">
              {funnel.description || "Keine Beschreibung"}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{funnel.views.toLocaleString("de-DE")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{funnel.leads}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{conversionRate}%</span>
              </div>
            </div>
          </div>
          <Link href={`/funnels/${funnel.id}`}>
            <Button size="icon" variant="ghost" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const statusColors: Record<Lead["status"], string> = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    qualified: "bg-purple-500",
    converted: "bg-emerald-500",
    lost: "bg-gray-400",
  };

  const statusLabels: Record<Lead["status"], string> = {
    new: "Neu",
    contacted: "Kontaktiert",
    qualified: "Qualifiziert",
    converted: "Konvertiert",
    lost: "Verloren",
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    return `vor ${diffDays} Tagen`;
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-medium text-sm shrink-0">
          {lead.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{lead.name || "Unbekannt"}</div>
          <div className="text-sm text-muted-foreground truncate">{lead.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:block text-sm text-muted-foreground text-right">
          <div>{lead.funnelName}</div>
          <div>{timeAgo(lead.createdAt)}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${statusColors[lead.status]}`} />
          <span className="text-sm">{statusLabels[lead.status]}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  useDocumentTitle("Dashboard");

  const { data: funnels, isLoading: funnelsLoading } = useQuery<Funnel[]>({
    queryKey: ["/api/funnels"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const totalViews = funnels?.reduce((sum, f) => sum + f.views, 0) || 0;
  const totalLeads = leads?.length || 0;
  const activeFunnels = funnels?.filter(f => f.status === "published").length || 0;
  const avgConversion = funnels && funnels.length > 0
    ? (funnels.reduce((sum, f) => sum + (f.views > 0 ? (f.leads / f.views) * 100 : 0), 0) / funnels.length).toFixed(1)
    : "0.0";

  const recentLeads = leads?.slice(0, 5) || [];
  const topFunnels = funnels?.slice(0, 3) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Willkommen zurück! Hier ist deine Übersicht.</p>
        </div>
        <Link href="/funnels/new">
          <Button className="gap-2" data-testid="button-new-funnel">
            <Plus className="h-4 w-4" />
            Neuer Funnel
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gesamte Views"
          value={totalViews.toLocaleString("de-DE")}
          change="+12.5%"
          changeType="positive"
          icon={Eye}
          loading={funnelsLoading}
        />
        <StatCard
          title="Neue Leads"
          value={totalLeads}
          change="+8.2%"
          changeType="positive"
          icon={Users}
          loading={leadsLoading}
        />
        <StatCard
          title="Aktive Funnels"
          value={activeFunnels}
          icon={Layers}
          loading={funnelsLoading}
        />
        <StatCard
          title="Ø Conversion-Rate"
          value={`${avgConversion}%`}
          change="+2.1%"
          changeType="positive"
          icon={TrendingUp}
          loading={funnelsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Top Funnels</CardTitle>
            <Link href="/funnels">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Alle ansehen
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelsLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : topFunnels.length > 0 ? (
              topFunnels.map((funnel) => (
                <FunnelCard key={funnel.id} funnel={funnel} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Noch keine Funnels erstellt</p>
                <Link href="/funnels/new">
                  <Button variant="link" className="mt-2">
                    Ersten Funnel erstellen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Neueste Leads</CardTitle>
            <Link href="/leads">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Alle ansehen
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Noch keine Leads gesammelt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
