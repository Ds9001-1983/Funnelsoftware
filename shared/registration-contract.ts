/** Versioniert mit den zugehörigen Dokumenten; bei Textänderungen neue Fassung anlegen. */
export const REGISTRATION_CONTRACT = {
  version: "2026-10-12",
  businessDeclaration: "Ich nutze Trichterwerk als Unternehmer für meine gewerbliche oder selbstständige berufliche Tätigkeit und bin zum Vertragsschluss für das angegebene Unternehmen berechtigt.",
  acceptanceDeclaration: "Ich akzeptiere die AGB und den Auftragsverarbeitungsvertrag (AVV).",
} as const;

export interface RegistrationContract {
  version: string;
  acceptedAt: string;
  businessName: string;
  businessDeclaration: string;
  acceptanceDeclaration: string;
  documents: Record<"agb" | "avv", { sha256: string }>;
}

export function legalDocumentUrl(version: string, document: "agb" | "avv"): string {
  return `/api/legal/${encodeURIComponent(version)}/${document}`;
}
