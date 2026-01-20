import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, AlertCircle, Check, Sparkles } from "lucide-react";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Die Passwörter stimmen nicht überein");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen haben");
      return;
    }

    // Validate username length
    if (formData.username.length < 3) {
      setError("Der Benutzername muss mindestens 3 Zeichen haben");
      return;
    }

    setIsLoading(true);

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      displayName: formData.displayName || undefined,
    });

    if (result.success) {
      setLocation("/");
    } else {
      setError(result.error || "Registrierung fehlgeschlagen");
    }

    setIsLoading(false);
  };

  const features = [
    "14 Tage Pro-Features kostenlos",
    "Unbegrenzte Funnels",
    "Drag & Drop Builder",
    "Analytics & Insights",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Trichterwerk</h1>
          <Badge variant="secondary" className="mt-2">
            <Sparkles className="h-3 w-3 mr-1" />
            14 Tage kostenlos testen
          </Badge>
          <p className="text-muted-foreground mt-2">
            Starte jetzt deine kostenlose Testversion
          </p>
        </div>

        {/* Features List */}
        <div className="flex flex-wrap justify-center gap-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Check className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Register Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Kostenlos starten</CardTitle>
            <CardDescription className="text-center">
              Erstelle deinen Account und teste 14 Tage kostenlos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayName">Name (optional)</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Max Mustermann"
                  value={formData.displayName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Benutzername *</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="max123"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
                <p className="text-xs text-muted-foreground">
                  Mindestens 3 Zeichen, keine Leerzeichen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="max@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Mindestens 6 Zeichen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Account wird erstellt...
                  </>
                ) : (
                  "14 Tage kostenlos testen"
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Keine Kreditkarte erforderlich
              </p>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Bereits registriert?
                </span>
              </div>
            </div>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Zur Anmeldung
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Mit der Registrierung akzeptierst du unsere{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Nutzungsbedingungen
          </a>{" "}
          und{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Datenschutzrichtlinie
          </a>
          .
        </p>
      </div>
    </div>
  );
}
