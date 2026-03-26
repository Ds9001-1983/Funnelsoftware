import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, CheckCircle, AlertCircle } from "lucide-react";

export default function VerifyEmail() {
  const searchString = useSearch();
  const token = new URLSearchParams(searchString).get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Kein Verifizierungs-Token gefunden.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "E-Mail erfolgreich verifiziert!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verifizierung fehlgeschlagen.");
        }
      } catch {
        setStatus("error");
        setMessage("Verbindungsfehler. Bitte versuche es später erneut.");
      }
    }

    verify();
  }, [token]);

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
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="mx-auto mb-2">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <CardTitle>E-Mail wird verifiziert...</CardTitle>
                <CardDescription>Bitte warte einen Moment.</CardDescription>
              </>
            )}
            {status === "success" && (
              <>
                <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>E-Mail verifiziert!</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
            {status === "error" && (
              <>
                <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Verifizierung fehlgeschlagen</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {status !== "loading" && (
              <Link href="/login">
                <Button className="w-full">
                  {status === "success" ? "Zum Login" : "Zurück zum Login"}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
