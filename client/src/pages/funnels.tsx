import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Users,
  TrendingUp,
  Pencil,
  Copy,
  Trash2,
  ExternalLink,
  Layers,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Funnel } from "@shared/schema";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "published" | "draft" | "archived";

function FunnelGridCard({ funnel, onDelete }: { funnel: Funnel; onDelete: () => void }) {
  const conversionRate = funnel.views > 0 
    ? ((funnel.leads / funnel.views) * 100).toFixed(1) 
    : "0.0";

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="group overflow-hidden">
      <div 
        className="h-32 relative"
        style={{ backgroundColor: funnel.theme.primaryColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <Badge 
            variant={funnel.status === "published" ? "default" : "secondary"}
            className="bg-white/90 text-foreground hover:bg-white"
          >
            {funnel.status === "published" ? "Live" : funnel.status === "draft" ? "Entwurf" : "Archiviert"}
          </Badge>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-white/90 hover:bg-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/funnels/${funnel.id}`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplizieren
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Vorschau
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate mb-1">{funnel.name}</h3>
        <p className="text-sm text-muted-foreground truncate mb-3">
          {funnel.description || "Keine Beschreibung"}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{funnel.views.toLocaleString("de-DE")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{funnel.leads}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{conversionRate}%</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Aktualisiert: {formatDate(funnel.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelListRow({ funnel, onDelete }: { funnel: Funnel; onDelete: () => void }) {
  const conversionRate = funnel.views > 0 
    ? ((funnel.leads / funnel.views) * 100).toFixed(1) 
    : "0.0";

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors group">
      <div 
        className="h-12 w-12 rounded-md shrink-0"
        style={{ backgroundColor: funnel.theme.primaryColor }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-medium truncate">{funnel.name}</h3>
          <Badge 
            variant={funnel.status === "published" ? "default" : "secondary"}
            className="shrink-0"
          >
            {funnel.status === "published" ? "Live" : funnel.status === "draft" ? "Entwurf" : "Archiviert"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {funnel.description || "Keine Beschreibung"}
        </p>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5 w-20">
          <Eye className="h-3.5 w-3.5" />
          <span>{funnel.views.toLocaleString("de-DE")}</span>
        </div>
        <div className="flex items-center gap-1.5 w-16">
          <Users className="h-3.5 w-3.5" />
          <span>{funnel.leads}</span>
        </div>
        <div className="flex items-center gap-1.5 w-16">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{conversionRate}%</span>
        </div>
        <div className="w-24 text-right">
          {formatDate(funnel.updatedAt)}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link href={`/funnels/${funnel.id}`}>
          <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/funnels/${funnel.id}`}>
                <Pencil className="h-4 w-4 mr-2" />
                Bearbeiten
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplizieren
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              Vorschau
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function Funnels() {
  useDocumentTitle("Funnels");

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: funnels, isLoading } = useQuery<Funnel[]>({
    queryKey: ["/api/funnels"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/funnels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      toast({
        title: "Funnel gelöscht",
        description: "Der Funnel wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Funnel konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const filteredFunnels = funnels?.filter((funnel) => {
    const matchesStatus = statusFilter === "all" || funnel.status === statusFilter;
    const matchesSearch = 
      funnel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      funnel.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Funnels</h1>
          <p className="text-muted-foreground">Verwalte und erstelle deine Marketing-Funnels</p>
        </div>
        <Link href="/funnels/new">
          <Button className="gap-2" data-testid="button-new-funnel">
            <Plus className="h-4 w-4" />
            Neuer Funnel
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Funnels suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-funnels"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="published">Live</SelectItem>
            <SelectItem value="draft">Entwurf</SelectItem>
            <SelectItem value="archived">Archiviert</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-none"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-none"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-32 w-full rounded-t-md rounded-b-none" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
            ))}
          </Card>
        )
      ) : filteredFunnels.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFunnels.map((funnel) => (
              <FunnelGridCard 
                key={funnel.id} 
                funnel={funnel} 
                onDelete={() => deleteMutation.mutate(funnel.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground">
              <div className="h-12 w-12 shrink-0" />
              <div className="flex-1">Name</div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="w-20">Views</div>
                <div className="w-16">Leads</div>
                <div className="w-16">Conv.</div>
                <div className="w-24 text-right">Aktualisiert</div>
              </div>
              <div className="w-20 shrink-0" />
            </div>
            {filteredFunnels.map((funnel) => (
              <FunnelListRow 
                key={funnel.id} 
                funnel={funnel}
                onDelete={() => deleteMutation.mutate(funnel.id)}
              />
            ))}
          </Card>
        )
      ) : (
        <Card className="p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || statusFilter !== "all"
                ? "Keine Funnels gefunden"
                : "Erstelle deinen ersten Funnel"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Versuche andere Suchkriterien oder setze die Filter zurück"
                : "Mit Funnels sammelst du Leads und konvertierst Besucher zu Kunden. Starte mit einem Template oder erstelle deinen eigenen Funnel."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/funnels/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ersten Funnel erstellen
                  </Button>
                </Link>
              </div>
            )}
            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                data-testid="button-reset-filters"
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
