import { hasPlatformOptOut, PLATFORM_OPTOUT_COOKIE, PLATFORM_OPTOUT_MAX_AGE } from "@shared/platform-privacy";
let blockedInMemory = false;
export function browserPrivacySignal(): boolean {
  return typeof navigator !== "undefined" && (navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true);
}
export function platformMeasurementBlocked(): boolean {
  if (blockedInMemory || browserPrivacySignal()) return true;
  try { return hasPlatformOptOut(document.cookie); } catch { return true; }
}
/** false means the preference could not persist; this tab still stops measuring. */
export function setPlatformOptOut(blocked: boolean): boolean {
  blockedInMemory = blocked;
  try {
    document.cookie = `${PLATFORM_OPTOUT_COOKIE}=${blocked ? "1" : ""}; Path=/; Max-Age=${blocked ? PLATFORM_OPTOUT_MAX_AGE : 0}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    return hasPlatformOptOut(document.cookie) === blocked;
  } catch { return false; }
}
