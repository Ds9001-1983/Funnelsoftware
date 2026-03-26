import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Die gewünschte Seite existiert nicht oder wurde verschoben.
          </p>

          <Link href="/">
            <Button className="mt-6 w-full" variant="default">
              <Home className="h-4 w-4 mr-2" />
              Zurück zur Startseite
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
