import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  Calendar,
  Filter,
  Download,
  Trash2,
  Eye,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Lead, Funnel } from "@shared/schema";

type StatusFilter = "all" | Lead["status"];

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

function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!lead) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-semibold text-xl">
              {lead.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{lead.name || "Unbekannt"}</h3>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${statusColors[lead.status]}`} />
                <span className="text-sm text-muted-foreground">
                  {statusLabels[lead.status]}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {lead.email && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">E-Mail</div>
                  <div className="font-medium">{lead.email}</div>
                </div>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Telefon</div>
                  <div className="font-medium">{lead.phone}</div>
                </div>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Unternehmen</div>
                  <div className="font-medium">{lead.company}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Erstellt am</div>
                <div className="font-medium">{formatDate(lead.createdAt)}</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-sm text-muted-foreground mb-2">Funnel</div>
            <Badge variant="secondary">{lead.funnelName}</Badge>
            {lead.source && (
              <Badge variant="outline" className="ml-2">
                {lead.source}
              </Badge>
            )}
          </div>

          {lead.message && (
            <div className="pt-2">
              <div className="text-sm text-muted-foreground mb-2">Nachricht</div>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{lead.message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeadRow({
  lead,
  onView,
  onDelete,
  onStatusChange,
}: {
  lead: Lead;
  onView: () => void;
  onDelete: () => void;
  onStatusChange: (status: Lead["status"]) => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors group">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-medium shrink-0">
        {lead.name?.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium truncate">{lead.name || "Unbekannt"}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {lead.email && (
            <span className="truncate max-w-[200px]">{lead.email}</span>
          )}
          {lead.phone && (
            <span className="hidden md:inline">{lead.phone}</span>
          )}
        </div>
      </div>
      <div className="hidden lg:block text-sm text-muted-foreground shrink-0 w-36 truncate">
        {lead.funnelName}
      </div>
      <div className="hidden md:block text-sm text-muted-foreground shrink-0 w-24">
        {lead.source || "-"}
      </div>
      <div className="shrink-0">
        <Select
          value={lead.status}
          onValueChange={(v) => onStatusChange(v as Lead["status"])}
        >
          <SelectTrigger className="w-[130px] h-8" data-testid={`select-status-${lead.id}`}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusColors[lead.status]}`} />
              <span className="text-sm">{statusLabels[lead.status]}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusColors[value as Lead["status"]]}`} />
                  <span>{label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-muted-foreground shrink-0 w-24 text-right hidden sm:block">
        {formatDate(lead.createdAt)}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>
            <Eye className="h-4 w-4 mr-2" />
            Details anzeigen
          </DropdownMenuItem>
          {lead.email && (
            <DropdownMenuItem asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                E-Mail senden
              </a>
            </DropdownMenuItem>
          )}
          {lead.phone && (
            <DropdownMenuItem asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Anrufen
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
  );
}

export default function Leads() {
  useDocumentTitle("Leads");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [funnelFilter, setFunnelFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: funnels } = useQuery<Funnel[]>({
    queryKey: ["/api/funnels"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Lead["status"] }) => {
      await apiRequest("PATCH", `/api/leads/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Status aktualisiert",
        description: "Der Lead-Status wurde erfolgreich geändert.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead gelöscht",
        description: "Der Lead wurde erfolgreich gelöscht.",
      });
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesFunnel = funnelFilter === "all" || lead.funnelId === funnelFilter;
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesFunnel && matchesSearch;
  }) || [];

  const statusCounts = leads?.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Kontakte</h1>
          <p className="text-muted-foreground">
            Verwalte deine Leads und Kontakte
          </p>
        </div>
        <Button variant="outline" className="gap-2" data-testid="button-export">
          <Download className="h-4 w-4" />
          Exportieren
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(statusLabels).map(([status, label]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all hover-elevate ${
              statusFilter === status ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
            onClick={() => setStatusFilter(statusFilter === status ? "all" : status as StatusFilter)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${statusColors[status as Lead["status"]]}`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-2xl font-bold">
                  {statusCounts[status] || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Leads suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-leads"
          />
        </div>
        <Select value={funnelFilter} onValueChange={setFunnelFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-funnel-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Funnel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Funnels</SelectItem>
            {funnels?.map((funnel) => (
              <SelectItem key={funnel.id} value={funnel.id}>
                {funnel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground">
          <div className="h-10 w-10 shrink-0" />
          <div className="flex-1">Kontakt</div>
          <div className="w-36 hidden lg:block">Funnel</div>
          <div className="w-24 hidden md:block">Quelle</div>
          <div className="w-[130px]">Status</div>
          <div className="w-24 text-right hidden sm:block">Erstellt</div>
          <div className="w-9" />
        </div>
        {leadsLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onView={() => setSelectedLead(lead)}
              onDelete={() => deleteMutation.mutate(lead.id)}
              onStatusChange={(status) =>
                updateMutation.mutate({ id: lead.id, status })
              }
            />
          ))
        ) : (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || statusFilter !== "all" || funnelFilter !== "all"
                ? "Keine Leads gefunden"
                : "Noch keine Leads vorhanden"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || funnelFilter !== "all"
                ? "Versuche andere Suchkriterien oder setze die Filter zurück"
                : "Leads werden automatisch hier angezeigt, sobald Besucher deine Funnels ausfüllen. Teile deine Funnel-Links, um Leads zu sammeln."}
            </p>
            {(searchQuery || statusFilter !== "all" || funnelFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setFunnelFilter("all");
                }}
                data-testid="button-reset-filters"
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>
        )}
      </Card>

      <LeadDetailDialog
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </div>
  );
}
