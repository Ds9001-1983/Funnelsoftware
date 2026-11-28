import { useSyncExternalStore } from "react";

interface OnboardingProgress {
  dismissed?: boolean;
  edited?: boolean;
  tested?: boolean;
  selectedFunnelId?: number;
}

const changeEvent = "tw-onboarding-change";
const fallback = new Map<string, string>();
const keyFor = (userId: number, uuid?: string) => `tw-onboarding:v2:${userId}:${uuid ?? "dashboard"}`;

function snapshot(key: string): string {
  try { return fallback.get(key) ?? localStorage.getItem(key) ?? "{}"; }
  catch { return fallback.get(key) ?? "{}"; }
}

function parse(raw: string): OnboardingProgress {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object") return {};
    return {
      dismissed: value.dismissed === true,
      edited: value.edited === true,
      tested: value.tested === true,
      selectedFunnelId: Number.isSafeInteger(value.selectedFunnelId) && value.selectedFunnelId > 0 ? value.selectedFunnelId : undefined,
    };
  } catch { return {}; }
}

/** Only UI preferences and milestones; never store answers or contact data. */
export function updateOnboardingProgress(userId: number, uuid: string | undefined, update: Partial<OnboardingProgress>) {
  const key = keyFor(userId, uuid);
  const raw = JSON.stringify({ ...parse(snapshot(key)), ...update });
  try { localStorage.setItem(key, raw); fallback.delete(key); }
  catch { fallback.set(key, raw); }
  window.dispatchEvent(new Event(changeEvent));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

export function useOnboardingProgress(userId: number, uuid?: string) {
  const key = keyFor(userId, uuid);
  return parse(useSyncExternalStore(subscribe, () => snapshot(key), () => "{}"));
}
