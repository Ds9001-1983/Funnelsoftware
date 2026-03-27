import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  X,
  Eye,
  Users,
  FileSpreadsheet,
  FileText,
  CalendarRange,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const answers = lead.answers as Record<string, any> | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
              {(lead.name || lead.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{lead.name || "Unbekannt"}</h2>
              <Badge className={`${statusColors[lead.status]} text-white text-[10px]`}>
                {statusLabels[lead.status]}
              </Badge>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs hover:bg-muted/80 transition-colors">
                <Mail className="h-3.5 w-3.5" />
                E-Mail
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs hover:bg-muted/80 transition-colors">
                <Phone className="h-3.5 w-3.5" />
                Anrufen
              </a>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
          {/* Kontaktdaten */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kontaktdaten</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Erstellt am</span>
                <span className="ml-auto font-medium">{formatDate(lead.createdAt)}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{lead.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Funnel + Quelle */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Funnel</h4>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">{lead.funnelName || "Unbekannt"}</Badge>
              {lead.source && <Badge variant="outline">{lead.source}</Badge>}
            </div>
          </div>

          {/* Funnel-Antworten */}
          {answers && Object.keys(answers).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Funnel-Antworten</h4>
              <div className="space-y-2">
                {Object.entries(answers).map(([key, value]) => (
                  <div key={key} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-[11px] text-muted-foreground mb-0.5">{key}</p>
                    <p className="text-sm font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nachricht */}
          {lead.message && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nachricht</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{lead.message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ExportFormat = "csv" | "excel";

interface ExportOptions {
  format: ExportFormat;
  includeAnswers: boolean;
  dateFrom: string;
  dateTo: string;
}

function ExportDialog({
  open,
  onOpenChange,
  leads,
  statusFilter,
  funnelFilter,
  funnelName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  statusFilter: StatusFilter;
  funnelFilter: string;
  funnelName?: string;
}) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filter leads by date range
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      if (dateFrom && leadDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (leadDate > endDate) return false;
      }
      return true;
    });
  }, [leads, dateFrom, dateTo]);

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const exportToCSV = () => {
    const headers = ["Name", "E-Mail", "Telefon", "Unternehmen", "Status", "Funnel", "Quelle", "Erstellt"];
    if (includeAnswers) {
      headers.push("Antworten");
    }

    const rows = filteredLeads.map(lead => {
      const row = [
        lead.name || "",
        lead.email || "",
        lead.phone || "",
        lead.company || "",
        statusLabels[lead.status],
        lead.funnelName || "",
        lead.source || "",
        formatDate(lead.createdAt),
      ];
      if (includeAnswers && lead.answers) {
        row.push(JSON.stringify(lead.answers));
      }
      return row;
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  const exportToExcel = () => {
    // Create a simple HTML table for Excel export
    const headers = ["Name", "E-Mail", "Telefon", "Unternehmen", "Status", "Funnel", "Quelle", "Erstellt"];
    if (includeAnswers) {
      headers.push("Antworten");
    }

    const rows = filteredLeads.map(lead => {
      const row = [
        lead.name || "",
        lead.email || "",
        lead.phone || "",
        lead.company || "",
        statusLabels[lead.status],
        lead.funnelName || "",
        lead.source || "",
        formatDate(lead.createdAt),
      ];
      if (includeAnswers && lead.answers) {
        row.push(JSON.stringify(lead.answers));
      }
      return row;
    });

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `leads-export-${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  const handleExport = () => {
    if (format === "csv") {
      exportToCSV();
    } else {
      exportToExcel();
    }
  };

  const filterDescription = [];
  if (statusFilter !== "all") {
    filterDescription.push(`Status: ${statusLabels[statusFilter as Lead["status"]]}`);
  }
  if (funnelFilter !== "all" && funnelName) {
    filterDescription.push(`Funnel: ${funnelName}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leads exportieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Filter info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-1">Export-Übersicht</div>
            <div className="text-sm text-muted-foreground">
              {filteredLeads.length} Lead{filteredLeads.length !== 1 ? "s" : ""} werden exportiert
              {filterDescription.length > 0 && (
                <div className="text-xs mt-1">
                  Filter: {filterDescription.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <Label>Export-Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat("csv")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  format === "csv"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">CSV</span>
              </button>
              <button
                onClick={() => setFormat("excel")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  format === "excel"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span className="font-medium">Excel</span>
              </button>
            </div>
          </div>

          {/* Date range filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Zeitraum (optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Von</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bis</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAnswers"
              checked={includeAnswers}
              onCheckedChange={(checked) => setIncludeAnswers(checked === true)}
            />
            <Label htmlFor="includeAnswers" className="text-sm cursor-pointer">
              Funnel-Antworten einschließen
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleExport} disabled={filteredLeads.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportieren ({filteredLeads.length})
          </Button>
        </DialogFooter>
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
  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
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
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: funnels } = useQuery<Funnel[]>({
    queryKey: ["/api/funnels"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Lead["status"] }) => {
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
    mutationFn: async (id: number) => {
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
    const matchesFunnel = funnelFilter === "all" || String(lead.funnelId) === funnelFilter;
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
        <Button
          variant="outline"
          className="gap-2"
          data-testid="button-export"
          onClick={() => setShowExportDialog(true)}
          disabled={!filteredLeads.length}
        >
          <Download className="h-4 w-4" />
          Exportieren
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {(Object.entries(statusLabels) as [Lead["status"], string][]).map(([status, label]) => {
          const columnLeads = filteredLeads.filter(l => l.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{columnLeads.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {columnLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                          {(lead.name || lead.email || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{lead.name || lead.email || "Unbekannt"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(lead.createdAt as string).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(Object.entries(statusLabels) as [Lead["status"], string][])
                              .filter(([s]) => s !== lead.status)
                              .map(([s, l]) => (
                                <DropdownMenuItem key={s} onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: lead.id, status: s }); }}>
                                  <div className={`h-2 w-2 rounded-full ${statusColors[s]} mr-2`} />
                                  {l}
                                </DropdownMenuItem>
                              ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(lead.id); }}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnLeads.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Keine Kontakte
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Leads suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
            data-testid="input-search-leads"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={funnelFilter} onValueChange={setFunnelFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-funnel-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Funnel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Funnels</SelectItem>
            {funnels?.map((funnel) => (
              <SelectItem key={funnel.id} value={String(funnel.id)}>
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

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        leads={filteredLeads}
        statusFilter={statusFilter}
        funnelFilter={funnelFilter}
        funnelName={funnels?.find(f => String(f.id) === funnelFilter)?.name}
      />
    </div>
  );
}
