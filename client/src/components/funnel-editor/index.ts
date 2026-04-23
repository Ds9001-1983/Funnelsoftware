/**
 * Funnel-Editor Komponenten
 *
 * Dieses Modul enthält alle wiederverwendbaren Komponenten für den Funnel-Editor.
 * Die Komponenten sind aus der ursprünglichen monolithischen funnel-editor.tsx
 * extrahiert worden, um die Wartbarkeit und Testbarkeit zu verbessern.
 */

// Konstanten und Typen
export * from "./constants";

// UI-Komponenten
export { DraggableElement } from "./DraggableElement";
export { FunnelProgress } from "./FunnelProgress";
export { SortablePageItem } from "./SortablePageItem";
export { SortableElementItem } from "./SortableElementItem";
export { DropIndicator, DragPreview } from "./DropIndicator";

// Dialog-Komponenten
export { AddPageDialog } from "./AddPageDialog";
export { PersonalizationInserter } from "./PersonalizationInserter";
export { SectionTemplatesPicker } from "./SectionTemplatesPicker";

// Editor-Komponenten
export { ElementPalette, ElementPaletteCompact } from "./ElementPalette";
export { ConditionalLogicEditor } from "./ConditionalLogicEditor";
export { LayoutSelector } from "./LayoutSelector";
export { SectionEditor } from "./SectionEditor";
export { SectionPreview, AddSectionButton } from "./SectionPreview";
export { PageEditor } from "./PageEditor";
export { ElementStyleEditor } from "./ElementStyleEditor";
export { FormValidationEditor } from "./FormValidationEditor";
export { FormFieldWithValidation, validateField, validateAllFields } from "./FormFieldWithValidation";
export { ABTestEditor } from "./ABTestEditor";

// Kontext-Menü & Toolbars. `InlineTextEditor`/`InlineHeadingEditor` und die
// alte `ContextMenu`-Eigenimplementierung wurden durch `InlineEditable`
// (Doppelklick-Edit) bzw. Radix-`ContextMenu` ersetzt. Die Dateien bleiben
// als Referenz für ein späteres Rich-Text-Toolbar-Feature erhalten.
export { NavigatorPanel } from "./NavigatorPanel";
export { FloatingToolbar, useToolbarPosition } from "./FloatingToolbar";

// Quiz-Komponenten
export * from "./QuizElement";

// Device Preview
export * from "./DevicePreview";

// Phone Preview (extracted from funnel-editor.tsx)
export { PhonePreview } from "./PhonePreview";
export { ElementWrapper, elementTypeLabels } from "./ElementWrapper";
export { ElementPreviewRenderer, SectionPreviewRenderer } from "./ElementPreviewRenderer";

// Element Properties Panel (extracted from funnel-editor.tsx)
export { ElementPropertiesPanel } from "./ElementPropertiesPanel";
