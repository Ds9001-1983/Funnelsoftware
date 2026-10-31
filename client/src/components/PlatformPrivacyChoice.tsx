import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { browserPrivacySignal, platformMeasurementBlocked, setPlatformOptOut } from "@/lib/platform-privacy";

export function PlatformPrivacyChoice() {
  const [blocked, setBlocked] = useState(platformMeasurementBlocked);
  const [failed, setFailed] = useState(false);
  const signal = browserPrivacySignal();
  const { data } = useQuery<{ retentionDays: number | null }>({
    queryKey: ["/api/public/platform-privacy"],
    queryFn: async () => {
      const response = await fetch("/api/public/platform-privacy");
      if (!response.ok) throw new Error("Aufbewahrungsstatus nicht erreichbar");
      return response.json();
    },
  });
  return <div className="mt-4 rounded-lg border p-4 space-y-3">
    <p className="text-sm text-slate-600">{data ? data.retentionDays
      ? `Einzelereignisse werden nach ${data.retentionDays} Tagen zur Löschung vorgemerkt. Die Ausführung wartet auf die externe Sicherungsbestätigung; Sicherungskopien unterliegen eigenen Fristen. Beim Wiederherstellen werden vorgemerkte Löschungen erneut angewendet.`
      : "Eine automatische Aufbewahrungsfrist ist derzeit noch nicht aktiviert. Auskunfts- und Löschanfragen sind über die Kontaktdaten im Impressum möglich."
      : "Der aktuelle Aufbewahrungsstatus wird geladen. Bei fehlender Verbindung sind die Kontaktdaten im Impressum erreichbar."}</p>
    <p role="status" className="text-sm">
      {blocked ? "Die Reichweitenmessung ist in diesem Browser ausgeschaltet." : "Die Reichweitenmessung ist in diesem Browser eingeschaltet."}
      {signal && " Dein Browser sendet ein Datenschutzsignal, das wir beachten."}
    </p>
    <Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal py-2" disabled={signal} onClick={() => {
      const next = !blocked;
      setFailed(!setPlatformOptOut(next));
      setBlocked(platformMeasurementBlocked());
    }}>{blocked ? "Widerspruch zurücknehmen" : "Reichweitenmessung widersprechen"}</Button>
    {failed && <p role="alert" className="text-sm">Die Einstellung konnte nicht dauerhaft gespeichert werden. Der Widerspruch gilt in diesem geöffneten Tab. Aktiviere Do Not Track oder Global Privacy Control für einen dauerhaften Schutz.</p>}
    <p className="text-sm text-slate-600">Für deinen Widerspruch speichern wir ausschließlich die Einstellung in einem Cookie für bis zu ein Jahr. Sie gilt für diesen Browser und diese Domain. Nach dem Löschen des Cookies oder in einem anderen Browser musst du erneut widersprechen. Marketing-Einstellungen verwaltest du getrennt über die Cookie-Auswahl.</p>
  </div>;
}
