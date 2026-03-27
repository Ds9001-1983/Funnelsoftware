import { useState } from "react";
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

function ProfileSettings() {
  const { user, refetchUser } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [company, setCompany] = useState(user?.company || "");
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
          company,
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
        description: "Deine Profiländerungen wurden gespeichert.",
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
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company">Unternehmen</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Name deines Unternehmens"
                data-testid="input-settings-company"
              />
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
    </div>
  );
}

function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leadAlerts, setLeadAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

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
              <div className="font-medium">E-Mail-Benachrichtigungen</div>
              <div className="text-sm text-muted-foreground">
                Erhalte wichtige Updates per E-Mail
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              data-testid="switch-email-notifications"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Lead-Benachrichtigungen</div>
              <div className="text-sm text-muted-foreground">
                Sofortige Benachrichtigung bei neuen Leads
              </div>
            </div>
            <Switch
              checked={leadAlerts}
              onCheckedChange={setLeadAlerts}
              data-testid="switch-lead-alerts"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Wöchentlicher Report</div>
              <div className="text-sm text-muted-foreground">
                Erhalte jeden Montag eine Zusammenfassung
              </div>
            </div>
            <Switch
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
              data-testid="switch-weekly-report"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Marketing-E-Mails</div>
              <div className="text-sm text-muted-foreground">
                News, Tipps und Updates von Trichterwerk
              </div>
            </div>
            <Switch
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
              data-testid="switch-marketing-emails"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("de");

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

          <div className="space-y-2">
            <Label htmlFor="language">Sprache</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        credentials: "include",
      });
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
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
      });
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

export default function Settings() {
  useDocumentTitle("Einstellungen");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalte dein Konto und deine Präferenzen</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
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
      </Tabs>
    </div>
  );
}
