import { useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Zap, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const searchString = useSearch();
  const token = new URLSearchParams(searchString).get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Ungültiger Link</h2>
            <p className="text-muted-foreground mb-4">
              Dieser Link zum Zurücksetzen des Passworts ist ungültig.
            </p>
            <Link href="/forgot-password">
              <Button variant="outline">Neuen Link anfordern</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Passwort muss mindestens einen Großbuchstaben enthalten");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Passwort muss mindestens eine Zahl enthalten");
      return;
    }
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Passwort konnte nicht zurückgesetzt werden");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es später erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Trichterwerk</h1>
        </div>

        <Card className="shadow-lg">
          {success ? (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Passwort zurückgesetzt</CardTitle>
                <CardDescription>
                  Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt mit dem neuen Passwort anmelden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button className="w-full">Zum Login</Button>
                </Link>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Neues Passwort</CardTitle>
                <CardDescription className="text-center">
                  Wähle ein neues Passwort für deinen Account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Neues Passwort</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Min. 8 Zeichen, Großbuchstabe und Zahl
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Passwort zurücksetzen
                  </Button>

                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
                      <ArrowLeft className="h-4 w-4" />
                      Zurück zum Login
                    </Button>
                  </Link>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
