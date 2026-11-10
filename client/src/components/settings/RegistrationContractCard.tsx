import { useAuth } from "@/hooks/use-auth";
import { legalDocumentUrl } from "@shared/registration-contract";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegistrationContractCard() {
  const { user } = useAuth();
  const contract = user?.registrationContract;
  return (
    <Card data-testid="registration-contract">
      <CardHeader>
        <CardTitle>Vertragsunterlagen</CardTitle>
        <CardDescription>Nachweis deiner kostenlosen Registrierung</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {contract ? <>
          <p><strong>{contract.businessName}</strong></p>
          <p>Geschäftliche Nutzung bestätigt, AGB und AVV angenommen am {new Date(contract.acceptedAt).toLocaleString("de-DE")} · Fassung {contract.version}.</p>
          <div className="flex flex-wrap gap-4">
            <a className="underline" href={`${legalDocumentUrl(contract.version, "agb")}?download=1`}>AGB speichern</a>
            <a className="underline" href={`${legalDocumentUrl(contract.version, "avv")}?download=1`}>AVV speichern</a>
            <a className="underline" href="/api/auth/registration-contract">Nachweis samt Vertragstexten speichern</a>
          </div>
        </> : <p>Für dieses Konto liegt kein digitaler Registrierungsnachweis vor. Bei Fragen zu deinen Vertragsunterlagen wende dich an <a className="underline" href="mailto:info@superbrand.marketing">info@superbrand.marketing</a>.</p>}
      </CardContent>
    </Card>
  );
}
