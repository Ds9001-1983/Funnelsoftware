import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { Team, TeamMember, ApiKey } from "@shared/schema";
import {
  User,
  Bell,
  Palette,
  Globe,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
  Loader2,
  Users,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { AiConnectionSettings } from "@/components/settings/AiConnectionSettings";

function ProfileSettings() {
  const { user, refetchUser } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const initials = (user?.displayName || user?.username || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: name,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Fehler",
          description: data.error || "Profil konnte nicht gespeichert werden.",
          variant: "destructive",
        });
        return;
      }

      await refetchUser();
      toast({
        title: "Profil aktualisiert",
        // Bei E-Mail-Änderung weist der Server auf die Re-Verifizierung hin
        description: data.message || "Deine Profiländerungen wurden gespeichert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Speichern.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Verwalte deine persönlichen Informationen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.displayName || user?.username}</p>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Anzeigename</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-settings-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-settings-email"
              />
              <p className="text-xs text-muted-foreground">
                Eine Änderung erfordert die erneute Bestätigung der neuen Adresse.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-profile">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Änderungen speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordCard />
      <DeleteAccountCard />
    </div>
  );
}

function ChangePasswordCard() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Fehler", description: "Die Passwörter stimmen nicht überein.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Fehler", description: data.error || "Passwort konnte nicht geändert werden.", variant: "destructive" });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Passwort geändert", description: "Dein neues Passwort ist ab sofort gültig." });
    } catch {
      toast({ title: "Fehler", description: "Netzwerkfehler beim Ändern des Passworts.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passwort ändern</CardTitle>
        <CardDescription>
          Mindestens 8 Zeichen, ein Großbuchstabe und eine Zahl
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="current-password">Aktuelles Passwort</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Neues Passwort</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Wiederholen</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleChangePassword}
            disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Passwort ändern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteAccountCard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Fehler", description: data.error || "Konto konnte nicht gelöscht werden.", variant: "destructive" });
        return;
      }
      toast({ title: "Konto gelöscht", description: "Alle Daten wurden entfernt. Ein laufendes Abo wurde gekündigt." });
      navigate("/");
      window.location.reload();
    } catch {
      toast({ title: "Fehler", description: "Netzwerkfehler beim Löschen des Kontos.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Konto löschen</CardTitle>
        <CardDescription>
          Löscht dein Konto endgültig — inklusive aller Funnels, Leads und
          Uploads (Art. 17 DSGVO). Ein laufendes Abo wird automatisch gekündigt.
          Diese Aktion kann nicht rückgängig gemacht werden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="delete-password">Passwort zur Bestätigung</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Tippe LÖSCHEN zur Bestätigung</Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="LÖSCHEN"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !password || confirmText !== "LÖSCHEN"}
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Konto endgültig löschen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  // Einziger ECHTER Schalter — die früheren Attrappen (Updates, Wochenreport,
  // Marketing) wurden entfernt, bis es die Funktionen wirklich gibt.
  const [leadAlerts, setLeadAlerts] = useState(
    (user as { leadNotificationsEnabled?: boolean } | null)?.leadNotificationsEnabled !== false
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setLeadAlerts(enabled);
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ leadNotificationsEnabled: enabled }),
      });
      if (!response.ok) {
        setLeadAlerts(!enabled);
        toast({ title: "Fehler", description: "Einstellung konnte nicht gespeichert werden.", variant: "destructive" });
        return;
      }
      await refetchUser();
    } catch {
      setLeadAlerts(!enabled);
      toast({ title: "Fehler", description: "Netzwerkfehler beim Speichern.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungen</CardTitle>
          <CardDescription>Wähle aus, wie du benachrichtigt werden möchtest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Lead-Benachrichtigungen</div>
              <div className="text-sm text-muted-foreground">
                E-Mail bei jedem neuen Lead in deinen Funnels
              </div>
            </div>
            <Switch
              checked={leadAlerts}
              onCheckedChange={handleToggle}
              disabled={isSaving}
              data-testid="switch-lead-alerts"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Erscheinungsbild</CardTitle>
          <CardDescription>Passe das Aussehen der Anwendung an</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Farbschema</Label>
            <div className="grid grid-cols-3 gap-3">
              <Card
                className={`cursor-pointer p-4 text-center hover-elevate ${
                  theme === "light" ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                onClick={() => setTheme("light")}
              >
                <div className="h-8 w-8 rounded-full bg-white border mx-auto mb-2" />
                <span className="text-sm">Hell</span>
              </Card>
              <Card
                className={`cursor-pointer p-4 text-center hover-elevate ${
                  theme === "dark" ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                onClick={() => setTheme("dark")}
              >
                <div className="h-8 w-8 rounded-full bg-gray-900 mx-auto mb-2" />
                <span className="text-sm">Dunkel</span>
              </Card>
              <Card
                className={`cursor-pointer p-4 text-center hover-elevate ${
                  theme === "system" ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                onClick={() => setTheme("system")}
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-white to-gray-900 mx-auto mb-2" />
                <span className="text-sm">System</span>
              </Card>
            </div>
          </div>

          {/* Sprachauswahl entfernt: Es gibt keine i18n — der Select war eine
              Attrappe ohne Funktion. Wieder einbauen, wenn Übersetzungen existieren. */}
        </CardContent>
      </Card>
    </div>
  );
}

function BillingSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const status = user?.subscriptionStatus || "trial";
  const isPro = user?.isPro || false;
  const isAdmin = user?.isAdmin || false;
  const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const daysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/billing/create-checkout");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Fehler", description: data.error || "Checkout konnte nicht erstellt werden", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler", description: "Verbindungsfehler", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/billing/portal");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Fehler", description: data.error || "Portal konnte nicht geöffnet werden", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler", description: "Verbindungsfehler", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aktueller Plan</CardTitle>
          <CardDescription>Verwalte dein Abonnement</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Active Pro */}
          {(isPro || isAdmin) && status === "active" && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
              <div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  Pro Plan
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Aktiv</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Alle Features freigeschaltet
                </div>
              </div>
              <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Abo verwalten"}
              </Button>
            </div>
          )}

          {/* Trial with Stripe (payment info already provided) */}
          {status === "trial" && isPro && !isAdmin && (
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  Pro Plan
                  <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Testphase</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {daysLeft > 0
                    ? `Noch ${daysLeft} ${daysLeft === 1 ? "Tag" : "Tage"} kostenlos. Dein Abo startet automatisch danach.`
                    : "Deine Testphase ist abgelaufen. Dein Abo wird jetzt aktiv."}
                </div>
              </div>
              <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Abo verwalten"}
              </Button>
            </div>
          )}

          {/* Trial without Stripe (no payment info yet) */}
          {status === "trial" && !isPro && !isAdmin && (
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              daysLeft <= 3
                ? "bg-orange-500/10 border-orange-500/20"
                : "bg-primary/10 border-primary/20"
            }`}>
              <div>
                <div className="text-lg font-semibold">Testphase</div>
                <div className="text-sm text-muted-foreground">
                  {daysLeft > 0
                    ? `Noch ${daysLeft} ${daysLeft === 1 ? "Tag" : "Tage"} verbleibend. Hinterlege Zahlungsdaten für nahtlosen Übergang.`
                    : "Testphase abgelaufen"}
                </div>
              </div>
              <Button onClick={handleUpgrade} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Zahlungsdaten hinterlegen
              </Button>
            </div>
          )}

          {/* Cancelled / Expired */}
          {(status === "cancelled" || status === "expired") && !isAdmin && (
            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div>
                <div className="text-lg font-semibold">Kein aktives Abo</div>
                <div className="text-sm text-muted-foreground">
                  Dein Abonnement wurde beendet. Upgrade um weiterzumachen.
                </div>
              </div>
              <Button onClick={handleUpgrade} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Erneut abonnieren
              </Button>
            </div>
          )}

          {/* Past Due */}
          {status === "past_due" && (
            <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div>
                <div className="text-lg font-semibold">Zahlung ausstehend</div>
                <div className="text-sm text-muted-foreground">
                  Deine letzte Zahlung konnte nicht verarbeitet werden.
                </div>
              </div>
              <Button variant="destructive" onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Zahlung aktualisieren
              </Button>
            </div>
          )}

          {/* Admin override */}
          {isAdmin && status !== "active" && (
            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div>
                <div className="text-lg font-semibold">Admin-Account</div>
                <div className="text-sm text-muted-foreground">
                  Alle Features freigeschaltet (Admin-Berechtigung)
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Teams sind für den Launch deaktiviert (kaputte Einladungen, kein Annahme-Flow)
const TEAMS_ENABLED = false;

function TeamSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Record<number, TeamMember[]>>({});
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isEnterprise = user?.isPro || user?.subscriptionPlan === "enterprise";

  const fetchTeams = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/teams", { credentials: "include", signal });
      if (res.ok) setTeams(await res.json());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  const fetchMembers = async (teamId: number, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, { credentials: "include", signal });
      if (res.ok) {
        const data = await res.json();
        setMembers(prev => ({ ...prev, [teamId]: data }));
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchTeams(ac.signal);
    return () => ac.abort();
  }, []);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newTeamName.trim() }),
      });
      if (res.ok) {
        setNewTeamName("");
        fetchTeams();
        toast({ title: "Team erstellt" });
      } else {
        const data = await res.json();
        toast({ title: "Fehler", description: data.error, variant: "destructive" });
      }
    } catch {}
  };

  const inviteMember = async (teamId: number) => {
    if (!inviteEmail.trim()) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.ok) {
        setInviteEmail("");
        fetchMembers(teamId);
        toast({ title: "Einladung gesendet" });
      }
    } catch {}
  };

  const removeMember = async (teamId: number, memberId: number) => {
    try {
      await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchMembers(teamId);
    } catch {}
  };

  if (!isEnterprise) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">Team-Funktion</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Team-Accounts sind im Enterprise-Plan verfügbar.
          </p>
          <Button onClick={() => window.location.href = "/settings#billing"}>
            Plan upgraden
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>Verwalte deine Teams und Mitglieder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Neues Team erstellen..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
            />
            <Button onClick={createTeam} disabled={!newTeamName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Erstellen
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : teams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Noch keine Teams erstellt.</p>
          ) : (
            teams.map((team) => (
              <Card key={team.id} className="border">
                <CardHeader className="py-3 cursor-pointer" onClick={() => {
                  const id = selectedTeam === team.id ? null : team.id;
                  setSelectedTeam(id);
                  if (id && !members[id]) fetchMembers(id);
                }}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    <span className="text-xs text-muted-foreground">{team.role}</span>
                  </div>
                </CardHeader>
                {selectedTeam === team.id && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="E-Mail einladen..."
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        type="email"
                      />
                      <Button size="sm" onClick={() => inviteMember(team.id)}>Einladen</Button>
                    </div>
                    {(members[team.id] || []).map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <span className="text-sm font-medium">{m.displayName || m.username || m.invitedEmail}</span>
                          <span className="text-xs text-muted-foreground ml-2">{m.role}</span>
                        </div>
                        {m.role !== "owner" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMember(team.id, m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isEnterprise = user?.isPro || user?.subscriptionPlan === "enterprise";

  const fetchKeys = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/api-keys", { credentials: "include", signal });
      if (res.ok) setKeys(await res.json());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchKeys(ac.signal);
    return () => ac.abort();
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeyValue(data.key);
        setNewKeyName("");
        fetchKeys();
        toast({ title: "API-Key erstellt" });
      } else {
        const data = await res.json();
        toast({ title: "Fehler", description: data.error, variant: "destructive" });
      }
    } catch {}
  };

  const deleteKey = async (id: number) => {
    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE", credentials: "include" });
      fetchKeys();
      toast({ title: "API-Key gelöscht" });
    } catch {}
  };

  const copyKey = () => {
    if (newKeyValue) {
      navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isEnterprise) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Key className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">API-Zugang</h3>
          <p className="text-sm text-muted-foreground mb-4">
            API-Keys sind im Enterprise-Plan verfügbar.
          </p>
          <Button onClick={() => window.location.href = "/settings#billing"}>
            Plan upgraden
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* New key warning */}
      {newKeyValue && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-2">
                  Speichere diesen Key — er wird nur einmal angezeigt!
                </p>
                <div className="flex gap-2">
                  <Input value={newKeyValue} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={copyKey}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API-Keys</CardTitle>
          <CardDescription>Erstelle API-Keys für programmatischen Zugriff auf deine Funnels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Key-Name (z.B. CRM Integration)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createKey()}
            />
            <Button onClick={createKey} disabled={!newKeyName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Erstellen
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Noch keine API-Keys erstellt.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">{key.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{key.keyPrefix}</span>
                    {key.lastUsedAt && (
                      <span className="text-xs text-muted-foreground ml-2">
                        Zuletzt: {new Date(key.lastUsedAt).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteKey(key.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const SETTINGS_TABS = ["profile", "notifications", "appearance", "billing", "ai", "api"];

export default function Settings() {
  useDocumentTitle("Einstellungen");
  const { toast } = useToast();

  // Tab aus URL übernehmen: Stripe-Redirects (?tab=billing) und interne
  // Links (/settings#billing) landeten vorher immer auf "Profil".
  const [activeTab, setActiveTab] = useState(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("tab");
    const fromHash = window.location.hash.replace("#", "");
    const requested = fromQuery || fromHash;
    return requested && SETTINGS_TABS.includes(requested) ? requested : "profile";
  });

  // Erfolgs-/Abbruch-Feedback nach Rückkehr aus dem Stripe-Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      toast({
        title: "Willkommen an Bord! 🎉",
        description:
          "Dein Abo ist eingerichtet. Die Aktivierung kann einen Moment dauern — lade die Seite ggf. neu.",
      });
    } else if (params.get("cancelled") === "true") {
      toast({
        title: "Checkout abgebrochen",
        description: "Du kannst das Upgrade jederzeit hier abschließen.",
      });
    }
    if (params.has("upgraded") || params.has("cancelled")) {
      // Query bereinigen, damit der Toast bei Reload nicht erneut erscheint
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalte dein Konto und deine Präferenzen</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full max-w-2xl overflow-x-auto">
          <TabsTrigger value="profile" className="gap-2" data-testid="tab-profile">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Benachrichtigungen</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2" data-testid="tab-appearance">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Erscheinung</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2" data-testid="tab-billing">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Abrechnung</span>
          </TabsTrigger>
          {/* Team-Tab für den Launch deaktiviert: Einladungen nicht
              registrierter E-Mails schlagen mit 500 fehl (FK userId=0),
              es gibt weder Einladungs-Mail noch Annahme-Flow. Reaktivieren,
              wenn das Feature fertig gebaut ist (P2 im Launch-Plan). */}
          {TEAMS_ENABLED && (
            <TabsTrigger value="team" className="gap-2" data-testid="tab-team">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="ai" className="gap-2" data-testid="tab-ai">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">KI</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2" data-testid="tab-api">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
        {TEAMS_ENABLED && (
          <TabsContent value="team">
            <TeamSettings />
          </TabsContent>
        )}
        <TabsContent value="ai">
          <AiConnectionSettings />
        </TabsContent>
        <TabsContent value="api">
          <ApiKeySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
