import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

/** Patch only the known upload location; preserve the live site's TLS and
 * unrelated local settings. Refuse unfamiliar/nested locations. */
export function configureUploadCache(config) {
  const locations = [...config.matchAll(/^[ \t]*location\s+(?:\^~\s+)?\/uploads\/\s*\{[^{}]*\}/gm)];
  if (locations.length !== 1) throw new Error("Eindeutige nginx-Upload-Regel fehlt");
  const block = locations[0][0];
  if (!/^\s*alias\s+\/var\/www\/funnelflow\/uploads\/\s*;/m.test(block)) {
    throw new Error("Unerwartetes nginx-Upload-Verzeichnis");
  }
  const cleaned = block
    .replace(/^[ \t]*expires\s+[^;]+;[^\n]*\n/gm, "")
    .replace(/^[ \t]*add_header\s+Cache-Control\s+[^;]+;[^\n]*\n/gm, "");
  const updated = cleaned.replace(/\s*\}$/, '\n        expires off;\n        add_header Cache-Control "no-store" always;\n    }');
  return config.slice(0, locations[0].index) + updated + config.slice(locations[0].index + block.length);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4) throw new Error("Quell- und Zieldatei erforderlich");
  await writeFile(process.argv[3], configureUploadCache(await readFile(process.argv[2], "utf8")));
}
