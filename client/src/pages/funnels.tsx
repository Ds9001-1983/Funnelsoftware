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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useEnsureBodyUnlocked } from "@/hooks/use-ensure-body-unlocked";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Funnel } from "@shared/schema";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "published" | "draft" | "archived";

function FunnelGridCard({ funnel, onDelete, onClone }: { funnel: Funnel; onDelete: () => void; onClone: () => void }) {
  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return "Zuletzt bearbeitet am " + date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <Link href={`/funnels/${funnel.id}`}>
        <div
          className="h-44 relative overflow-hidden"
          style={{ backgroundColor: funnel.theme.backgroundColor || "#f8f9fa" }}
        >
          {/* Funnel preview with theme colors */}
          <div className="absolute inset-4 rounded-lg border border-border/20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4">
            <div
              className="w-full h-3 rounded-full opacity-30"
              style={{ backgroundColor: funnel.theme.primaryColor }}
            />
            <div className="w-3/4 h-2 rounded-full bg-muted-foreground/10" />
            <div className="w-2/3 h-2 rounded-full bg-muted-foreground/10" />
            <div
              className="mt-2 px-6 py-2 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: funnel.theme.primaryColor }}
            >
              {funnel.pages?.[0]?.buttonText || "Weiter"}
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{funnel.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(funnel.updatedAt)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 -mr-2">
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
              <DropdownMenuItem onClick={onClone}>
                <Copy className="h-4 w-4 mr-2" />
                Duplizieren
              </DropdownMenuItem>
              {funnel.uuid && (
                <DropdownMenuItem asChild>
                  <a href={`/f/${funnel.slug || funnel.uuid}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Vorschau
                  </a>
                </DropdownMenuItem>
              )}
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

        <div className="flex items-center gap-2 mt-3">
          {funnel.status === "published" && (
            <>
              <a
                href={`/f/${funnel.slug || funnel.uuid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
              <Badge variant="default" className="text-xs px-2 py-0">Live</Badge>
            </>
          )}
          {funnel.status === "draft" && (
            <Badge variant="secondary" className="text-xs px-2 py-0">Entwurf</Badge>
          )}
          {funnel.leads > 0 && (
            <Badge variant="outline" className="text-xs px-2 py-0">
              {funnel.leads} {funnel.leads === 1 ? "Lead" : "Leads"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelListRow({ funnel, onDelete, onClone }: { funnel: Funnel; onDelete: () => void; onClone: () => void }) {
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
            <DropdownMenuItem onClick={onClone}>
              <Copy className="h-4 w-4 mr-2" />
              Duplizieren
            </DropdownMenuItem>
            {funnel.uuid && (
              <DropdownMenuItem asChild>
                <a href={`/f/${funnel.uuid}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Vorschau
                </a>
              </DropdownMenuItem>
            )}
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

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem("funnels-view-mode") as ViewMode) || "grid"
  );
  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("funnels-view-mode", mode);
  };
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Funnel | null>(null);
  const { toast } = useToast();

  useEnsureBodyUnlocked(!!deleteTarget);

  const { data: funnels, isLoading } = useQuery<Funnel[]>({
    queryKey: ["/api/funnels"],
  });

  // Kein Optimistic Update in `onMutate`: Ein `setQueryData` während der
  // Radix-Dialog-Exit-Animation führte zu hängendem `pointer-events: none`
  // am <body> — die Seite fror ein, bis der User neu lud. `onSettled` macht
  // den Refresh sauber, nachdem der Dialog längst geschlossen ist.
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/funnels/${id}`);
      return id;
    },
    onSuccess: (_data, deletedId) => {
      toast({
        title: "Funnel gelöscht",
        description: "Der Funnel wurde gelöscht.",
        action: (
          <ToastAction
            altText="Rückgängig machen"
            onClick={async () => {
              try {
                await apiRequest("PATCH", `/api/funnels/${deletedId}/restore`);
                queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
              } catch {
                toast({ title: "Fehler", description: "Funnel konnte nicht wiederhergestellt werden.", variant: "destructive" });
              }
            }}
          >
            Rückgängig
          </ToastAction>
        ),
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Funnel konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/funnels/${id}/clone`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funnels"] });
      toast({
        title: "Funnel dupliziert",
        description: "Eine Kopie des Funnels wurde erstellt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Funnel konnte nicht dupliziert werden.",
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
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Alle Funnels</h1>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48 h-9"
              data-testid="input-search-funnels"
            />
          </div>
          <Link href="/funnels/new">
            <Button className="gap-2" data-testid="button-new-funnel">
              <Plus className="h-4 w-4" />
              Neuer Funnel
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-44 w-full rounded-t-md rounded-b-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFunnels.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFunnels.map((funnel) => (
            <FunnelGridCard
              key={funnel.id}
              funnel={funnel}
              onDelete={() => setDeleteTarget(funnel)}
              onClone={() => cloneMutation.mutate(funnel.id)}
            />
          ))}
        </div>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Funnel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du den Funnel &quot;{deleteTarget?.name}&quot; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Daten
              (Leads, Analytics) gehen ebenfalls verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
