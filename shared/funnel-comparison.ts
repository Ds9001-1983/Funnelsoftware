import { contentKey, type FunnelDocument } from "./funnel-document";
export interface DocumentChange { label: string; kind: "added" | "removed" | "changed"; pageId?: string }
export function compareDocuments(before: FunnelDocument, after: FunnelDocument): DocumentChange[] {
  const changes: DocumentChange[] = [];
  for (const [key, label] of [["name", "Name"], ["description", "Beschreibung"], ["theme", "Design"], ["impressumUrl", "Impressum-Link"], ["datenschutzUrl", "Datenschutz-Link"], ["ogImageUrl", "Vorschaubild"], ["abTests", "A/B-Tests"]] as const) {
    if (contentKey(before[key]) !== contentKey(after[key])) changes.push({ label, kind: "changed" });
  }
  if (contentKey(before.pages.map(page => page.id)) !== contentKey(after.pages.map(page => page.id))) changes.push({ label: "Seitenreihenfolge oder Seitenanzahl", kind: "changed" });
  for (const oldPage of before.pages) if (!after.pages.some(page => page.id === oldPage.id)) changes.push({ label: `Seite „${oldPage.title}“`, kind: "removed", pageId: oldPage.id });
  for (const page of after.pages) {
    const oldPage = before.pages.find(old => old.id === page.id);
    if (!oldPage) { changes.push({ label: `Seite „${page.title}“`, kind: "added", pageId: page.id }); continue; }
    const { elements, ...settings } = page, { elements: oldElements, ...oldSettings } = oldPage;
    if (contentKey(settings) !== contentKey(oldSettings)) changes.push({ label: `${page.title}: Seiteneinstellungen, Layout oder Besucherregeln`, kind: "changed", pageId: page.id });
    if (contentKey(elements.map(el => el.id)) !== contentKey(oldElements.map(el => el.id))) changes.push({ label: `${page.title}: Elementreihenfolge oder Anzahl`, kind: "changed", pageId: page.id });
    for (const old of oldElements) if (!elements.some(el => el.id === old.id)) changes.push({ label: `${page.title}: ${old.content?.slice(0, 60) || old.label || old.type}`, kind: "removed", pageId: page.id });
    for (const element of elements) {
      const old = oldElements.find(el => el.id === element.id);
      if (contentKey(old) !== contentKey(element)) changes.push({ label: `${page.title}: ${element.content?.slice(0, 60) || element.label || element.type}`, kind: old ? "changed" : "added", pageId: page.id });
    }
  }
  return changes;
}
export interface RevisionContent { id: number | null; version: number; content: FunnelDocument }
