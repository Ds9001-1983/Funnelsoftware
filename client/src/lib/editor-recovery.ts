import { documentFromFunnel, documentSchema, type FunnelDocument } from "@shared/funnel-document";
import type { Funnel } from "@shared/schema";

const prefix = "tw-editor-recovery:";
function key(funnel: Funnel) { return `${prefix}${funnel.userId}:${funnel.id}`; }
export function readRecovery(funnel: Funnel): FunnelDocument | null {
  try {
    const raw = localStorage.getItem(key(funnel));
    if (!raw) return null;
    const candidate = JSON.parse(raw);
    // Validate without replacing the original data: unknown legacy properties
    // are opaque, and must survive a recovery just as they survive a normal save.
    if (!documentSchema.safeParse(candidate).success) return null;
    return candidate as FunnelDocument;
  } catch { return null; }
}
export function storeRecovery(funnel: Funnel): boolean {
  try { localStorage.setItem(key(funnel), JSON.stringify(documentFromFunnel(funnel))); return true; }
  catch { return false; }
}
export function clearRecovery(funnel: Funnel) {
  try { localStorage.removeItem(key(funnel)); } catch { /* storage unavailable */ }
}
export function clearAllEditorRecovery() {
  try { Object.keys(localStorage).filter(key => key.startsWith(prefix)).forEach(key => localStorage.removeItem(key)); } catch { /* storage unavailable */ }
}
export function downloadRecovery(funnel: Partial<Funnel>) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(documentFromFunnel(funnel), null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "funnel-inhaltssicherung.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
