import type { PageElement } from "@shared/schema";
import type { ResponsiveDevice } from "@shared/funnel-responsive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResponsiveProperties({ element, device, onDeviceChange, onUpdate }: { element: PageElement; device: ResponsiveDevice; onDeviceChange: (device: ResponsiveDevice) => void; onUpdate: (updates: Partial<PageElement>) => void }) {
  const values = element.responsive?.[device] ?? {};
  type Settings = NonNullable<NonNullable<PageElement["responsive"]>["desktop"]>;
  const change = (key: keyof Settings, value: string) => {
    const next = { ...values };
    if (value === "") delete next[key]; else next[key] = Number(value);
    const responsive = { ...element.responsive, [device]: next };
    if (!Object.keys(next).length) delete responsive[device];
    onUpdate({ responsive: Object.keys(responsive).length ? responsive : undefined });
  };
  const fields: Array<[keyof Settings, string, number, number]> = [["padding", "Innenabstand (px)", 0, 96], ["margin", "Außenabstand (px)", 0, 96]];
  if (["heading", "text", "button", "input", "textarea"].includes(element.type)) fields.unshift(["fontSize", "Schriftgröße (px)", 8, 120]);
  if (element.type === "image") fields.push(["imageHeight", "Bildhöhe (px)", 32, 1200], ["imageX", "Bildausschnitt horizontal (%)", 0, 100], ["imageY", "Bildausschnitt vertikal (%)", 0, 100]);
  return <section className="p-4 border-t space-y-3" aria-label="Darstellung je Gerät">
    <h4 className="font-semibold text-sm">Darstellung je Gerät</h4>
    <div className="flex gap-1">{(["mobile", "tablet", "desktop"] as const).map(item => <Button key={item} variant={device === item ? "default" : "outline"} size="sm" onClick={() => onDeviceChange(item)}>{({ mobile: "Handy", tablet: "Tablet", desktop: "Desktop" })[item]}</Button>)}</div>
    <p className="text-xs text-muted-foreground">Handy unter 640 px, Tablet bis 1023 px. Leere Felder übernehmen die Desktop-Einstellung bzw. den bisherigen Stil. Bildausschnitte wirken bei fester Bildhöhe.</p>
    {fields.map(([key, label, min, max]) => <label key={key} className="block text-xs space-y-1">{label}<Input type="number" min={min} max={max} step={1} key={`${element.id}:${device}:${key}:${values[key] ?? ""}`} defaultValue={values[key] ?? ""} placeholder="Übernehmen" onBlur={event => { const input = event.currentTarget; if (!input.validity.valid) { input.reportValidity(); input.value = String(values[key] ?? ""); return; } change(key, input.value); }} /></label>)}
    <Button size="sm" variant="outline" disabled={!element.responsive?.[device]} onClick={() => { const responsive = { ...element.responsive }; delete responsive[device]; onUpdate({ responsive: Object.keys(responsive).length ? responsive : undefined }); }}>Geräteeinstellungen zurücksetzen</Button>
  </section>;
}
