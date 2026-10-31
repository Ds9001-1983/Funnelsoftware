/** Host-only preference; no visitor ID. Written only on explicit objection. */
export const PLATFORM_OPTOUT_COOKIE = "tw_platform_optout";
export const PLATFORM_OPTOUT_MAX_AGE = 365 * 24 * 60 * 60;
export function hasPlatformOptOut(cookie: string): boolean {
  return cookie.split(";").some(part => part.trim() === `${PLATFORM_OPTOUT_COOKIE}=1`);
}
