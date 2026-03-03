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
  ChevronLeft,
  ChevronRight,
  LogOut,
  RefreshCw,
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
  totalFunnels: number;
  totalLeads: number;
  newUsersToday: number;
  newUsersThisWeek: number;
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
      const res = await fetch(`/api/admin/users/${updates.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates.data),
      });
      if (!res.ok) throw new Error("Update failed");
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Benutzer gelöscht" });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Gesamt</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Trials</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.activeTrials || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Pro</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.proUsers || 0}</p>
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
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Heute</span>
              </div>
              <p className="text-2xl font-bold mt-1">+{stats?.newUsersToday || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Woche</span>
              </div>
              <p className="text-2xl font-bold mt-1">+{stats?.newUsersThisWeek || 0}</p>
            </CardContent>
          </Card>
        </div>

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
                          <DropdownMenu>
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
                if (selectedUser) {
                  deleteUserMutation.mutate(selectedUser.id);
                }
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
