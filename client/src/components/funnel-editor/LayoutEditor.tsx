import type { PersonalizationContext } from "@shared/funnel-personalization";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { pageElementSchema, type FunnelPage, type PageElement, type Theme } from "@shared/schema";
import { addLayoutSection, deleteLayoutSection, duplicateLayoutSection, moveLayoutElement, moveLayoutSection, setSectionColumns, type LayoutSection } from "@shared/funnel-layout-edit";
import { resolveDesign } from "@shared/funnel-layout";
import { PageLayout } from "@/components/funnel-viewer/PageLayout";
import { layoutPresets } from "@/lib/layout-presets";
import { loadFont } from "@/lib/font-loader";
import { Button } from "@/components/ui/button";
import { ElementPreviewRenderer, type ElementActions } from "./ElementPreviewRenderer";
import { InlineEditable } from "./InlineEditable";

interface LayoutEditorProps {
  page: FunnelPage;
  personalizationContext?: PersonalizationContext;
  theme: Theme;
  onChange: (page: FunnelPage) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  activeColumnId: string | null;
  onChooseColumn: (id: string) => void;
  onAddElement: (type: PageElement["type"], columnId?: string) => void;
  elementActions: ElementActions;
  blockedReason: string | null;
}

const selectClass = "h-8 rounded border bg-background px-2 text-xs text-foreground min-w-0";
export function LayoutEditor({ personalizationContext, page, theme, onChange, selectedElementId, onSelectElement, activeColumnId, onChooseColumn, onAddElement, elementActions, blockedReason }: LayoutEditorProps) {
  const [presetId, setPresetId] = useState("empty-2");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const design = resolveDesign(theme, page);
  useEffect(() => { loadFont(design.fontFamily); }, [design.fontFamily]);
  if (!page.layout) return null;
  const layout = page.layout;
  const changeSection = (id: string, updates: Partial<LayoutSection>) => onChange({ ...page, layout: { ...layout, sections: layout.sections.map(section => section.id === id ? { ...section, ...updates } : section) } });
  const selectedColumn = layout.sections.flatMap(section => section.columns).find(column => column.elementIds.includes(selectedElementId ?? ""));

  return <div className="space-y-3" data-testid="layout-editor">
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium" htmlFor="layout-width">Seitenbreite</label>
        <select id="layout-width" className={selectClass} value={layout.width} disabled={!!blockedReason} onChange={event => onChange({ ...page, layout: { ...layout, width: event.target.value as typeof layout.width } })}>
          <option value="narrow">Schmal</option><option value="wide">Breit</option><option value="full">Volle Breite</option>
        </select>
        <select aria-label="Abschnittsvorlage" className={`${selectClass} flex-1`} value={presetId} onChange={event => setPresetId(event.target.value)}>
          {layoutPresets.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
        </select>
        <Button size="sm" disabled={!!blockedReason || layout.sections.length >= 100} onClick={() => {
          const preset = layoutPresets.find(p => p.id === presetId)!;
          onChange(addLayoutSection(page, preset.name, preset.columns));
        }}><Plus className="h-4 w-4 mr-1" />Abschnitt hinzufügen</Button>
      </div>
      {blockedReason && <p role="status" className="text-xs text-amber-700">{blockedReason}</p>}
      <p className="text-xs text-muted-foreground">Wähle eine Spalte und füge links Elemente ein. Ziehe Elemente zwischen Spalten oder nutze die Auswahl.</p>
      {selectedElementId && <label className="flex items-center gap-2 text-xs">Element verschieben
        <select aria-label="Element in Spalte verschieben" className={`${selectClass} flex-1`} value={selectedColumn?.id ?? ""} disabled={!!blockedReason} onChange={event => { onChange(moveLayoutElement(page, selectedElementId, event.target.value)); onChooseColumn(event.target.value); }}>
          {layout.sections.flatMap((section, sectionIndex) => section.columns.map((column, columnIndex) => <option key={column.id} value={column.id}>{section.name || `Abschnitt ${sectionIndex + 1}`} · Spalte {columnIndex + 1}</option>))}
        </select>
      </label>}
    </div>
    <div className="rounded-xl shadow-sm border overflow-hidden px-4 py-8" style={{ backgroundColor: design.backgroundColor, color: design.textColor, fontFamily: design.fontFamily }}>
      <div className="mx-auto space-y-6" style={{ maxWidth: design.width }}>
        <InlineEditable value={page.title} onCommit={title => onChange({ ...page, title })} placeholder="Seitentitel" className="text-2xl md:text-3xl font-bold text-center w-full" style={{ fontSize: design.headingSize }} renderDisplay={value => <h1 className="text-center font-bold text-2xl md:text-3xl" style={{ fontSize: design.headingSize }}>{value}</h1>} />
        {page.subtitle && <InlineEditable value={page.subtitle} onCommit={subtitle => onChange({ ...page, subtitle })} className="text-center text-base opacity-70 w-full" style={{ fontSize: design.bodySize }} renderDisplay={value => <p className="text-center text-base opacity-70" style={{ fontSize: design.bodySize }}>{value}</p>} />}
        <PageLayout page={page} spacing={design.spacing} textColor={design.textColor}
          sectionControls={(section, index) => <div className="border rounded bg-background text-foreground p-2 mb-3 space-y-2" data-testid={`section-controls-${section.id}`}
            onDragOver={event => { if (!blockedReason && event.dataTransfer.types.includes("application/x-funnel-section")) event.preventDefault(); }}
            onDrop={event => {
              const id = event.dataTransfer.getData("application/x-funnel-section");
              if (!id || blockedReason) return;
              event.preventDefault(); event.stopPropagation();
              const from = layout.sections.findIndex(candidate => candidate.id === id);
              if (from >= 0) onChange(moveLayoutSection(page, id, index - from));
            }}>
            <div className="flex flex-wrap gap-1 items-center">
              <span draggable={!blockedReason} title="Abschnitt ziehen" className="cursor-grab p-1" onDragStart={event => { event.dataTransfer.setData("application/x-funnel-section", section.id); event.dataTransfer.effectAllowed = "move"; }}><GripVertical className="h-4 w-4" /></span>
              <input aria-label={`Name von Abschnitt ${index + 1}`} disabled={!!blockedReason} maxLength={100} className="w-24 min-w-0 flex-1 bg-transparent text-sm font-medium border-b" value={section.name ?? ""} onChange={event => changeSection(section.id, { name: event.target.value })} />
              <select aria-label={`Spalten in Abschnitt ${index + 1}`} className={selectClass} disabled={!!blockedReason} value={section.columns.length} onChange={event => onChange(setSectionColumns(page, section.id, Number(event.target.value)))}>
                {[1, 2, 3].map(count => <option key={count} value={count}>{count} {count === 1 ? "Spalte" : "Spalten"}</option>)}
              </select>
              <Button size="icon" variant="ghost" aria-label={`Abschnitt ${index + 1} nach oben`} disabled={!!blockedReason || index === 0} onClick={() => onChange(moveLayoutSection(page, section.id, -1))}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={`Abschnitt ${index + 1} nach unten`} disabled={!!blockedReason || index === layout.sections.length - 1} onClick={() => onChange(moveLayoutSection(page, section.id, 1))}><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={`Abschnitt ${index + 1} duplizieren`} disabled={!!blockedReason || layout.sections.length >= 100} onClick={() => onChange(duplicateLayoutSection(page, section.id))}><Copy className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={`Abschnitt ${index + 1} löschen`} disabled={!!blockedReason} onClick={() => { if (!section.columns.some(column => column.elementIds.length) || window.confirm(`„${section.name || "Abschnitt"}“ und die enthaltenen Elemente löschen? Du kannst dies rückgängig machen.`)) onChange(deleteLayoutSection(page, section.id)); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <fieldset disabled={!!blockedReason} className="flex flex-wrap gap-3 items-center text-xs">
              <label>Hintergrund <input aria-label={`Hintergrund von Abschnitt ${index + 1}`} type="color" value={section.backgroundColor || design.backgroundColor} onChange={event => changeSection(section.id, { backgroundColor: event.target.value })} className="w-6 h-5 align-middle" /></label>
              <label>Innenabstand <input aria-label={`Innenabstand von Abschnitt ${index + 1}`} type="number" min={0} max={96} value={section.padding ?? 0} className="w-12 border rounded bg-background px-1" onChange={event => changeSection(section.id, { padding: Math.max(0, Math.min(96, Number(event.target.value))) })} /></label>
              <label>Spaltenabstand <input aria-label={`Spaltenabstand von Abschnitt ${index + 1}`} type="number" min={0} max={64} value={section.gap ?? design.spacing} className="w-12 border rounded bg-background px-1" onChange={event => changeSection(section.id, { gap: Math.max(0, Math.min(64, Number(event.target.value))) })} /></label>
            </fieldset>
          </div>}
          columnControls={(column, index) => <button type="button" aria-pressed={activeColumnId === column.id} className={`w-full border border-dashed rounded p-2 text-xs ${activeColumnId === column.id ? "border-primary bg-primary/10" : "opacity-70"}`} onClick={() => onChooseColumn(column.id)}>Spalte {index + 1} · Hier einfügen</button>}
          columnEvents={columnId => ({
            onDragOver: event => { if (!blockedReason && event.dataTransfer.types.some(type => ["application/x-funnel-element", "elementtype"].includes(type))) event.preventDefault(); },
            onDrop: event => {
              if (blockedReason) return;
              const id = event.dataTransfer.getData("application/x-funnel-element");
              const type = event.dataTransfer.getData("elementType");
              if (!id && !type) return;
              event.preventDefault(); event.stopPropagation();
              if (id) onChange(moveLayoutElement(page, id, columnId));
              else {
                const parsed = pageElementSchema.shape.type.safeParse(type);
                if (parsed.success) onAddElement(parsed.data, columnId);
              }
              onChooseColumn(columnId);
            },
          })}
          renderElement={(element, textColor) => <div>
            <button type="button" draggable={!blockedReason} disabled={!!blockedReason} aria-label="Element ziehen" className="cursor-grab opacity-50 hover:opacity-100" onDragStart={event => { event.dataTransfer.setData("application/x-funnel-element", element.id); event.dataTransfer.effectAllowed = "move"; }}><GripVertical className="h-3 w-3" /></button>
            <ElementPreviewRenderer personalizationContext={personalizationContext} element={element} textColor={textColor} primaryColor={theme.primaryColor} design={theme.design}
              selectedElementId={selectedElementId} onSelectElement={onSelectElement} formValues={formValues} updateFormValue={(id, value) => setFormValues(current => ({ ...current, [id]: value }))}
              onContentCommit={content => onChange({ ...page, elements: page.elements.map(candidate => candidate.id === element.id ? { ...candidate, content } : candidate) })}
              {...elementActions} />
          </div>} />
      </div>
    </div>
  </div>;
}
