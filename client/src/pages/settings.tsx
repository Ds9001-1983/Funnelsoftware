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

function ProfileSettings() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [company, setCompany] = useState("FunnelFlow GmbH");
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Profil aktualisiert",
      description: "Deine Profiländerungen wurden gespeichert.",
    });
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
                JD
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                Bild ändern
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG oder GIF. Max 2MB
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
                data-testid="input-settings-company"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} data-testid="button-save-profile">
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
                News, Tipps und Updates von FunnelFlow
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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aktueller Plan</CardTitle>
          <CardDescription>Verwalte dein Abonnement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
            <div>
              <div className="text-lg font-semibold">Pro Plan</div>
              <div className="text-sm text-muted-foreground">
                49€/Monat · Nächste Zahlung am 15. Feb 2026
              </div>
            </div>
            <Button variant="outline">Plan ändern</Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">Aktive Funnels</div>
              <div className="text-xs text-muted-foreground mt-1">von unbegrenzt</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">1.247</div>
              <div className="text-sm text-muted-foreground">Leads diesen Monat</div>
              <div className="text-xs text-muted-foreground mt-1">von unbegrenzt</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">45.2k</div>
              <div className="text-sm text-muted-foreground">Views diesen Monat</div>
              <div className="text-xs text-muted-foreground mt-1">von unbegrenzt</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zahlungsmethode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <div className="font-medium">•••• •••• •••• 4242</div>
                <div className="text-sm text-muted-foreground">Gültig bis 12/27</div>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Ändern
            </Button>
          </div>
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
