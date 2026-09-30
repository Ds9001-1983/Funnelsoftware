import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import type { Funnel, Theme } from "@shared/schema";
import { applyFunnelDesign, DEFAULT_DESIGN, designOverrideCount, themeForBrand, type BrandStyle } from "@shared/funnel-design";
import { FUNNEL_FONT_FAMILIES } from "@shared/funnel-fonts";
import { contentKey } from "@shared/funnel-document";
import { apiRequest } from "@/lib/queryClient";
import { themePresets } from "@/lib/design-system";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FunnelRenderer } from "@/components/funnel-viewer/FunnelRenderer";
import { ThemePresetPicker } from "./ThemePresetPicker";

const presetThemes: Record<string, Theme> = Object.fromEntries(themePresets.map(preset => [preset.id, {
  primaryColor: preset.palette.primary, backgroundColor: preset.palette.background, textColor: preset.palette.text,
  fontFamily: ({ ocean: "DM Sans", sunset: "Lora", forest: "Montserrat" } as Record<string, string>)[preset.id] ?? "Inter",
  design: { ...DEFAULT_DESIGN, ...({ ocean: { radius: 20 }, sunset: { headingSize: 36, radius: 4 }, forest: { radius: 8, spacing: 20 } } as Record<string, Partial<Theme["design"]>>)[preset.id] },
}]));

interface Props { funnel: Funnel; pageIndex: number; advancedEnabled: boolean; onChange: (updates: Partial<Funnel>) => void }
function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const valid = /^#[0-9a-fA-F]{6}$/.test(hex);
  return <div className="space-y-1 text-xs"><span>{label}</span><div className="flex gap-2">
    <Input aria-label={`Design: ${label}`} type="color" value={value} className="w-10 h-8 p-0.5" onChange={event => onChange(event.target.value)} />
    <Input aria-label={`Hex: ${label}`} value={hex} maxLength={7} aria-invalid={!valid} className="h-8 flex-1 min-w-0 font-mono" onChange={event => { setHex(event.target.value); if (/^#[0-9a-fA-F]{6}$/.test(event.target.value)) onChange(event.target.value); }} onBlur={() => { if (!valid) setHex(value); }} />
  </div></div>;
}
export function DesignPanel({ funnel, pageIndex, advancedEnabled, onChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<{ name: string; theme: Theme } | null>(null);
  const [resetOverrides, setResetOverrides] = useState(false);
  const library = useQuery<BrandStyle[]>({ queryKey: ["/api/brand-styles"], enabled: advancedEnabled });
  const brands = Array.isArray(library.data) ? library.data : [];
  const design = funnel.theme.design ?? DEFAULT_DESIGN;
  const count = designOverrideCount(funnel);
  const activeTest = funnel.abTests?.some(test => test.status === "running");
  const currentDesign = { primaryColor: funnel.theme.primaryColor, backgroundColor: funnel.theme.backgroundColor, textColor: funnel.theme.textColor, fontFamily: funnel.theme.fontFamily, design: funnel.theme.design };
  const selectedPreset = Object.keys(presetThemes).find(id => contentKey(presetThemes[id]) === contentKey(currentDesign)) ?? "";
  const preview = useMemo(() => proposal ? { ...funnel, ...applyFunnelDesign(funnel, proposal.theme, resetOverrides) } : null, [funnel, proposal, resetOverrides]);
  const propose = (name: string, theme: Theme) => { setResetOverrides(false); setProposal({ name, theme }); };
  const changeTheme = (updates: Partial<Theme>) => {
    const theme = { ...funnel.theme, ...updates };
    delete theme.source;
    onChange({ theme });
  };
  const changeDesign = (updates: Partial<NonNullable<Theme["design"]>>) => changeTheme({ design: { ...design, ...updates } });
  const saveBrand = async (brand?: BrandStyle, action: "replace" | "rename" | "archive" = "replace") => {
    let nextName = name.trim();
    if (brand && action === "rename") {
      const answer = window.prompt("Neuer Name für den Markenstil", brand.name);
      if (answer === null) return;
      nextName = answer.trim();
    }
    if (brand && action !== "rename" && !window.confirm(action === "archive"
      ? `„${brand.name}“ archivieren? Designs in bestehenden Funnels bleiben erhalten.`
      : `„${brand.name}“ durch das aktuelle Funnel-Design ersetzen? Bereits verwendete Kopien bleiben erhalten.`)) return;
    setBusy(true);
    try {
      const changes = action === "archive" ? { archived: true } : action === "rename" ? { name: nextName } : { ...(brand ? {} : { name: nextName }), theme: themeForBrand(funnel.theme) };
      await apiRequest(brand ? "PATCH" : "POST", brand ? `/api/brand-styles/${brand.id}` : "/api/brand-styles", { ...changes, ...(brand ? { expectedVersion: brand.version } : {}) });
      if (!brand) setName("");
      await queryClient.invalidateQueries({ queryKey: ["/api/brand-styles"] });
      toast({ title: action === "archive" ? "Markenstil archiviert" : "Markenstil gespeichert" });
    } catch (error) {
      toast({ title: "Markenstil konnte nicht gespeichert werden", description: error instanceof Error && error.name === "ZodError" ? "Wähle eine vorhandene Schriftart und Farben im Format #123456." : error instanceof Error ? error.message : "Bitte versuche es erneut.", variant: "destructive" });
      if ((error as { status?: number }).status === 409) void library.refetch();
    } finally { setBusy(false); }
  };

  return <div className="space-y-5" data-testid="design-panel">
    <ThemePresetPicker selectedThemeId={selectedPreset} onSelectTheme={id => {
      const theme = structuredClone(presetThemes[id]);
      if (!advancedEnabled) delete theme.design;
      propose(themePresets.find(preset => preset.id === id)!.name, theme);
    }} />
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold mb-2">Farben und Schrift</legend>
      {([['primaryColor', 'Primärfarbe'], ['backgroundColor', 'Hintergrund'], ['textColor', 'Textfarbe']] as const).map(([key, label]) => <ColorControl key={key} label={label} value={funnel.theme[key]} onChange={value => changeTheme({ [key]: value })} />)}
      <label className="block text-xs space-y-1"><span>Schriftart</span>
        <select aria-label="Design: Schriftart" className="w-full h-9 border rounded bg-background px-2" value={funnel.theme.fontFamily} onChange={event => changeTheme({ fontFamily: event.target.value })}>
          {!FUNNEL_FONT_FAMILIES.some(font => font === funnel.theme.fontFamily) && <option value={funnel.theme.fontFamily}>{funnel.theme.fontFamily}</option>}
          {FUNNEL_FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
        </select>
      </label>
    </fieldset>
    {advancedEnabled && <>
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold mb-2">Größen und Buttons</legend>
        {!funnel.theme.design && <p className="text-xs text-muted-foreground">Mit der ersten Änderung aktivierst du diese Designvorgaben. Individuelle Anpassungen bleiben erhalten.</p>}
        {([
          ["headingSize", "Überschriften", 20, 64], ["bodySize", "Textgröße", 14, 24],
          ["radius", "Rundungen", 0, 32], ["spacing", "Elementabstand", 8, 48],
        ] as const).map(([key, label, min, max]) => <label key={key} className="flex items-center justify-between gap-2 text-xs">{label} (px)
          <Input aria-label={`Design: ${label}`} type="number" min={min} max={max} value={design[key]} className="w-20 h-8" onChange={event => changeDesign({ [key]: Math.min(max, Math.max(min, Number(event.target.value))) })} />
        </label>)}
        <label className="block text-xs space-y-1"><span>Button-Stil</span>
          <select aria-label="Design: Button-Stil" className="w-full h-9 border rounded bg-background px-2" value={design.buttonStyle} onChange={event => changeDesign({ buttonStyle: event.target.value as typeof design.buttonStyle })}>
            <option value="solid">Gefüllt</option><option value="outline">Kontur</option><option value="soft">Dezent</option>
          </select>
        </label>
      </fieldset>
      <section className="space-y-3 border-t pt-4" aria-label="Eigene Markenstile">
        <h3 className="text-sm font-semibold">Eigene Markenstile</h3>
        <p className="text-xs text-muted-foreground">Speichere das globale Design für weitere Funnels. Beim Anwenden wird eine unabhängige Kopie übernommen.</p>
        <Input aria-label="Name des Markenstils" placeholder="z. B. Meine Marke" maxLength={80} value={name} onChange={event => setName(event.target.value)} />
        <Button size="sm" className="w-full" disabled={busy || !name.trim()} onClick={() => void saveBrand()}><Save className="mr-2 h-4 w-4" />Als Markenstil speichern</Button>
        {library.isLoading && <p className="text-xs">Markenstile werden geladen …</p>}
        {library.isError && <Button size="sm" variant="outline" onClick={() => void library.refetch()}>Markenstile erneut laden</Button>}
        {library.isSuccess && brands.length === 0 && <p className="text-xs text-muted-foreground">Noch kein eigener Markenstil gespeichert.</p>}
        {brands.map(brand => <div key={brand.id} className="rounded border p-2 space-y-2" data-testid={`brand-style-${brand.id}`}>
          <div className="flex items-center gap-2"><div className="flex gap-1" aria-hidden="true">{[brand.theme.primaryColor, brand.theme.backgroundColor, brand.theme.textColor].map((color, index) => <span key={index} className="h-4 w-4 rounded border" style={{ backgroundColor: color }} />)}</div>
            <span className="text-xs font-medium truncate" title={brand.name}>{brand.name}</span>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => propose(brand.name, { ...structuredClone(brand.theme), source: { id: brand.id, version: brand.version } })}>Vorschau</Button>
            <select aria-label={`Aktion für ${brand.name}`} disabled={busy} className="min-w-0 w-24 text-xs border rounded bg-background" value="" onChange={event => void saveBrand(brand, event.target.value as "replace" | "rename" | "archive")}>
              <option value="" disabled>Verwalten</option><option value="replace">Mit aktuellem Design ersetzen</option><option value="rename">Umbenennen</option><option value="archive">Archivieren</option>
            </select>
          </div>
        </div>)}
      </section>
    </>}
    <Dialog open={!!proposal} onOpenChange={open => { if (!open) setProposal(null); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle>Design-Vorschau: {proposal?.name}</DialogTitle><DialogDescription>Prüfe die aktuelle Seite. „Design anwenden“ übernimmt den Stil für den gesamten Entwurf als einen rückgängig machbaren Schritt. Live wird er beim Veröffentlichen.</DialogDescription></DialogHeader>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={resetOverrides} disabled={!!activeTest} onChange={event => setResetOverrides(event.target.checked)} /><span>{count} individuelle Anpassungen zurücksetzen: Seiten- und Abschnittsfarben, Seitenschrift, Elementfarben, Schriftgrößen, Rundungen und Button-Varianten.</span></label>
        <p className="text-xs text-muted-foreground">{activeTest ? "Während eines laufenden A/B-Tests bleiben individuelle Anpassungen erhalten." : "Ohne Häkchen bleiben individuelle Anpassungen erhalten. Inhalte und die Anordnung bleiben erhalten."}</p>
        <div className="flex-1 min-h-0 overflow-y-auto rounded border" data-testid="design-preview">
          {preview && preview.pages.length > 0 && <FunnelRenderer key={`${proposal?.name}-${resetOverrides}`} funnel={{ ...preview, pages: [preview.pages[pageIndex] ?? preview.pages[0]] }} mode="preview" className="min-h-[350px]" />}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setProposal(null)}>Abbrechen</Button><Button onClick={() => {
          if (!proposal) return;
          onChange(applyFunnelDesign(funnel, proposal.theme, resetOverrides && !activeTest));
          setProposal(null);
        }}>Design anwenden</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
