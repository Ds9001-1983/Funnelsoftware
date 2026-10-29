type LegalLinks = { impressumUrl?: string | null; datenschutzUrl?: string | null };

/** Absolute addresses work on both platform URLs and customer domains.
 * This validates the address, not availability or the legal text's content. */
export function isPublicationLegalUrl(value: string | null | undefined): boolean {
  if (!value || !/^https?:\/\//i.test(value) || /[\s\\]/.test(value)) return false;
  try {
    const url = new URL(value);
    return !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export function publicationLegalErrors(links: LegalLinks): string[] {
  const errors: string[] = [];
  if (!isPublicationLegalUrl(links.impressumUrl)) errors.push("Trage eine vollständige Impressum-URL mit https:// oder http:// ein.");
  if (!isPublicationLegalUrl(links.datenschutzUrl)) errors.push("Trage eine vollständige Datenschutzerklärung-URL mit https:// oder http:// ein.");
  return errors;
}
