import { documents20261012 } from "./legal/2026-10-12";

// Alte Einträge bleiben erhalten. Keine Ableitung alter Fassungen aus aktuellen Texten.
const archive: Record<string, Record<"agb" | "avv", { title: string; content: string }>> = {
  "2026-10-12": documents20261012,
};

export function getLegalDocument(version: string, name: string) {
  if (!Object.hasOwn(archive, version) || (name !== "agb" && name !== "avv")) return null;
  const document = archive[version][name];
  return {
    ...document,
    // Das komplette HTML ist unabhängig von UI, Datum und Benutzerdaten speicherbar.
    html: `<!doctype html>\n<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${document.title} · ${version}</title></head><body><main><h1>${document.title}</h1><p>Fassung: ${version}</p>${document.content}</main></body></html>`,
  };
}
