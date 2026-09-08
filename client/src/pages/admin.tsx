import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Shield,
  BarChart3,
  TrendingUp,
  Clock,
  CreditCard,
  Search,
  MoreHorizontal,
  UserX,
  UserCheck,
  Crown,
  Calendar,
  Layers,
  Target,
  Euro,
  UserMinus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  RefreshCw,
  Bug,
  Check,
  Undo2,
  Trash2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEnsureBodyUnlocked } from "@/hooks/use-ensure-body-unlocked";
import { apiRequest } from "@/lib/queryClient";
import { PlatformStats } from "@/components/admin/PlatformStats";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
  isPro: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  funnelCount: number;
  leadCount: number;
  daysInTrial: number | null;
  isTrialExpired: boolean;
}

interface AdminStats {
  totalUsers: number;
  activeTrials: number;
  proUsers: number;
  cancelledUsers: number;
  expiredTrials: number;
  totalFunnels: number;
  totalLeads: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  plansBreakdown: { plan: string; count: number }[];
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEnsureBodyUnlocked(showDeleteDialog || showEditDialog);

  const pageSize = 20;

  // Check if already logged in as admin
  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.isAdmin) {
          setIsLoggedIn(true);
        }
      });
  }, []);

  // Admin login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Login fehlgeschlagen");
        return;
      }

      setIsLoggedIn(true);
      toast({ title: "Willkommen zurück, Admin!" });
    } catch (error) {
      setLoginError("Verbindungsfehler");
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    navigate("/");
  };

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isLoggedIn,
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery<{
    users: AdminUser[];
    total: number;
  }>({
    queryKey: ["/api/admin/users", currentPage, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(currentPage * pageSize),
      });
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: isLoggedIn,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updates: { id: number; data: Partial<AdminUser> }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${updates.id}`, updates.data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Benutzer aktualisiert" });
      setShowEditDialog(false);
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren", variant: "destructive" });
    },
  });

  // Delete user mutation — kein Optimistic Update in `onMutate`, weil der
  // Re-Render während der Radix-Dialog-Exit-Animation den Body-Pointer-Lock
  // hängen lässt. `onSettled` invalidiert die Liste sauber, wenn der Dialog
  // garantiert zu ist.
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Benutzer gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  // Status badge helper
  const getStatusBadge = (user: AdminUser) => {
    if (user.isPro) {
      return <Badge className="bg-green-500">Pro</Badge>;
    }
    if (user.subscriptionStatus === "trial") {
      if (user.isTrialExpired) {
        return <Badge variant="destructive">Trial abgelaufen</Badge>;
      }
      return <Badge variant="secondary">Trial ({user.daysInTrial} Tage)</Badge>;
    }
    if (user.subscriptionStatus === "cancelled") {
      return <Badge variant="outline">Gekündigt</Badge>;
    }
    return <Badge variant="outline">{user.subscriptionStatus}</Badge>;
  };

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin-Bereich</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Melde dich mit deinen Admin-Zugangsdaten an
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  placeholder="Benutzername"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Passwort"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-500">{loginError}</p>
              )}
              <Button type="submit" className="w-full">
                Anmelden
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => navigate("/")}>
                Zurück zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-bold text-xl">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Kundenverwaltung</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Zahlende Kunden</p>
                  <p className="text-3xl font-bold mt-1">{stats?.proUsers || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-green-600" />
                </div>
              </div>
              {stats?.plansBreakdown && stats.plansBreakdown.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {stats.plansBreakdown.map((p) => (
                    <Badge key={p.plan} variant="secondary" className="text-xs">
                      {p.plan === "pro" ? "Pro" : p.plan === "basic" ? "Basic" : p.plan === "enterprise" ? "Enterprise" : p.plan}: {p.count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktive Trials</p>
                  <p className="text-3xl font-bold mt-1">{stats?.activeTrials || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Abgelaufen: {stats?.expiredTrials || 0}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Gekündigt: {stats?.cancelledUsers || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Neue User (Monat)</p>
                  <p className="text-3xl font-bold mt-1">+{stats?.newUsersThisMonth || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Heute: +{stats?.newUsersToday || 0}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Woche: +{stats?.newUsersThisWeek || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Gesamt User</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Funnels</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.totalFunnels || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Leads</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.totalLeads || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">MRR (geschätzt)</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {((stats?.proUsers || 0) * 49).toLocaleString("de-DE")}€
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cookieless Reichweitenmessung für trichterwerk.de */}
        <PlatformStats />

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kunden</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Lade Benutzer...
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Funnels</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Registriert</TableHead>
                      <TableHead>Letzter Login</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.username}
                              {user.isAdmin && (
                                <Shield className="h-3 w-3 text-primary" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(user)}</TableCell>
                        <TableCell>
                          {user.subscriptionPlan ? (
                            <Badge variant="outline" className="capitalize">{user.subscriptionPlan}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{user.funnelCount}</TableCell>
                        <TableCell>{user.leadCount}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString("de-DE")}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString(
                                "de-DE"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditDialog(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Abo verwalten
                              </DropdownMenuItem>
                              {!user.isPro && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateUserMutation.mutate({
                                      id: user.id,
                                      data: { isPro: true, subscriptionStatus: "active" },
                                    })
                                  }
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Zu Pro upgraden
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Zeige {currentPage * pageSize + 1} -{" "}
                    {Math.min(
                      (currentPage + 1) * pageSize,
                      usersData?.total || 0
                    )}{" "}
                    von {usersData?.total || 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={
                        (currentPage + 1) * pageSize >= (usersData?.total || 0)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <BugReportAdminCard />

        <ReferralAdminCard />
      </main>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abo verwalten</DialogTitle>
            <DialogDescription>
              {selectedUser?.username} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={selectedUser.subscriptionStatus}
                  onValueChange={(value) =>
                    setSelectedUser({ ...selectedUser, subscriptionStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="cancelled">Gekündigt</SelectItem>
                    <SelectItem value="expired">Abgelaufen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Plan</label>
                <Select
                  value={selectedUser.subscriptionPlan || ""}
                  onValueChange={(value) =>
                    setSelectedUser({ ...selectedUser, subscriptionPlan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPro"
                  checked={selectedUser.isPro}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, isPro: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="isPro" className="text-sm">
                  Pro-Zugang aktiv
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  updateUserMutation.mutate({
                    id: selectedUser.id,
                    data: {
                      isPro: selectedUser.isPro,
                      subscriptionStatus: selectedUser.subscriptionStatus,
                      subscriptionPlan: selectedUser.subscriptionPlan,
                    },
                  });
                }
              }}
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer löschen?</DialogTitle>
            <DialogDescription>
              Möchtest du {selectedUser?.username} wirklich löschen? Diese Aktion
              kann nicht rückgängig gemacht werden. Alle Funnels und Leads
              werden ebenfalls gelöscht.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!selectedUser) return;
                deleteUserMutation.mutate(selectedUser.id);
                setShowDeleteDialog(false);
                setSelectedUser(null);
              }}
            >
              Endgültig löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ReferralPartner {
  partnerId: number;
  partnerEmail: string;
  partnerName: string;
  referralCode: string | null;
  referred: {
    id: number;
    email: string;
    registeredAt: string;
    plan: string;
    subscriptionStatus: string;
    subscriptionStartedAt: string | null;
  }[];
}

/**
 * Partnerprogramm-Übersicht: Partner → Geworbene mit Plan-Status.
 * Grundlage der manuellen 25-%-Abrechnung (25 % von 49 € = 12,25 €/Monat
 * pro zahlendem Geworbenen, Auszahlung per Überweisung).
 */
interface AdminBugReport {
  id: number;
  description: string;
  pageUrl: string;
  userAgent?: string | null;
  viewport?: string | null;
  clientErrors?: string | null;
  screenshotPath?: string | null;
  attachmentPath?: string | null;
  status: "open" | "done";
  emailSentAt?: string | null;
  createdAt: string;
  reporterEmail?: string;
  reporterUsername?: string;
}

/**
 * Eingegangene Fehlermeldungen aus dem Produkt. Die Bilder liegen außerhalb des
 * öffentlichen uploads-Verzeichnisses und kommen nur über die Admin-Route —
 * ein Screenshot kann Kontaktdaten der Leads unserer Kunden zeigen.
 */
function BugReportAdminCard() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"open" | "done" | "all">("open");
  const [selected, setSelected] = useState<AdminBugReport | null>(null);

  const { data, isLoading } = useQuery<{ reports: AdminBugReport[]; total: number }>({
    queryKey: ["/api/admin/bug-reports", status],
    queryFn: async () => {
      const res = await fetch(`/api/admin/bug-reports?status=${status}&limit=50`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Fehlermeldungen konnten nicht geladen werden");
      return res.json();
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/admin/bug-reports"] });

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, next }: { id: number; next: "open" | "done" }) => {
      await apiRequest("PATCH", `/api/admin/bug-reports/${id}`, { status: next });
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/bug-reports/${id}`);
    },
    onSuccess: () => {
      setSelected(null);
      invalidate();
    },
  });

  const reports = data?.reports ?? [];
  const filters: { key: "open" | "done" | "all"; label: string }[] = [
    { key: "open", label: "Offen" },
    { key: "done", label: "Erledigt" },
    { key: "all", label: "Alle" },
  ];

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" /> Fehlermeldungen
          {data ? <span className="text-sm font-normal text-muted-foreground">({data.total})</span> : null}
        </CardTitle>
        <div className="flex gap-1">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={status === f.key ? "default" : "outline"}
              onClick={() => setStatus(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Wird geladen…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {status === "open"
              ? "Keine offenen Meldungen."
              : "Keine Meldungen in dieser Ansicht."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="p-2 font-medium">Datum</th>
                  <th className="p-2 font-medium">Melder</th>
                  <th className="p-2 font-medium">Seite</th>
                  <th className="p-2 font-medium">Beschreibung</th>
                  <th className="p-2 font-medium">Bild</th>
                  <th className="p-2 font-medium">Mail</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} id={`bug-${report.id}`} className="border-b last:border-0 align-top">
                    <td className="p-2 whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-2">{report.reporterEmail ?? "—"}</td>
                    <td className="p-2 max-w-[12rem] truncate" title={report.pageUrl}>
                      {report.pageUrl}
                    </td>
                    <td className="p-2 max-w-[20rem]">
                      <button
                        type="button"
                        className="text-left line-clamp-2 hover:underline"
                        onClick={() => setSelected(report)}
                      >
                        {report.description}
                      </button>
                    </td>
                    <td className="p-2">
                      {report.screenshotPath ? (
                        <button type="button" onClick={() => setSelected(report)}>
                          <img
                            src={`/api/admin/bug-reports/${report.id}/screenshot`}
                            alt=""
                            className="h-10 w-16 rounded border object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      {report.emailSentAt ? (
                        <Mail className="h-4 w-4 text-green-600" aria-label="E-Mail versendet" />
                      ) : (
                        <span className="text-muted-foreground" title="Keine E-Mail versendet">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant={report.status === "open" ? "default" : "secondary"}>
                        {report.status === "open" ? "offen" : "erledigt"}
                      </Badge>
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={setStatusMutation.isPending}
                        onClick={() =>
                          setStatusMutation.mutate({
                            id: report.id,
                            next: report.status === "open" ? "done" : "open",
                          })
                        }
                      >
                        {report.status === "open" ? (
                          <><Check className="mr-1 h-3.5 w-3.5" /> Erledigt</>
                        ) : (
                          <><Undo2 className="mr-1 h-3.5 w-3.5" /> Öffnen</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fehlermeldung #{selected?.id}</DialogTitle>
            <DialogDescription>
              {selected?.reporterEmail} · {selected?.pageUrl}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3">
                {selected.description}
              </p>
              {selected.screenshotPath && (
                <img
                  src={`/api/admin/bug-reports/${selected.id}/screenshot`}
                  alt="Screenshot der Meldung"
                  className="w-full rounded-lg border"
                />
              )}
              {selected.attachmentPath && (
                <img
                  src={`/api/admin/bug-reports/${selected.id}/attachment`}
                  alt="Angehängtes Bild der Meldung"
                  className="w-full rounded-lg border"
                />
              )}
              <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-muted-foreground">
                <dt>Fenster</dt><dd>{selected.viewport || "—"}</dd>
                <dt>Browser</dt><dd className="break-words">{selected.userAgent || "—"}</dd>
                <dt>E-Mail</dt>
                <dd>
                  {selected.emailSentAt
                    ? new Date(selected.emailSentAt).toLocaleString("de-DE")
                    : "nicht versendet"}
                </dd>
              </dl>
              {selected.clientErrors && (
                <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100 whitespace-pre-wrap">
                  {selected.clientErrors}
                </pre>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Meldung und Bilder endgültig löschen?")) {
                      deleteMutation.mutate(selected.id);
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Endgültig löschen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ReferralAdminCard() {
  const { data } = useQuery<{ partners: ReferralPartner[] }>({
    queryKey: ["/api/admin/referrals"],
  });

  const partners = data?.partners ?? [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Partner (Empfehlungsprogramm)</CardTitle>
      </CardHeader>
      <CardContent>
        {partners.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine geworbenen Registrierungen. Partner teilen ihren Link aus
            dem Dashboard (25&nbsp;% Lifetime-Provision, manuelle Auszahlung).
          </p>
        ) : (
          <div className="space-y-6">
            {partners.map((partner) => (
              <div key={partner.partnerId}>
                <div className="font-medium mb-2">
                  {partner.partnerName}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({partner.partnerEmail}
                    {partner.referralCode ? ` · Code ${partner.referralCode}` : ""})
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left">
                        <th className="p-2 font-medium">Geworbener</th>
                        <th className="p-2 font-medium">Registriert</th>
                        <th className="p-2 font-medium">Plan</th>
                        <th className="p-2 font-medium">Zahlend seit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partner.referred.map((ref) => (
                        <tr key={ref.id} className="border-b last:border-0">
                          <td className="p-2">{ref.email}</td>
                          <td className="p-2">
                            {new Date(ref.registeredAt).toLocaleDateString("de-DE")}
                          </td>
                          <td className="p-2">
                            <Badge variant={ref.plan === "pro" ? "default" : "secondary"}>
                              {ref.plan}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {ref.subscriptionStartedAt
                              ? new Date(ref.subscriptionStartedAt).toLocaleDateString("de-DE")
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
