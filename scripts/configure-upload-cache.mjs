import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

/** Patch only the known upload location; preserve the live site's TLS and
 * unrelated local settings. Refuse unfamiliar/nested locations. */
export function configureUploadCache(config) {
  const locations = [...config.matchAll(/^[ \t]*location\s+(?:\^~\s+)?\/uploads\/\s*\{[^{}]*\}/gm)];
  if (locations.length !== 1) throw new Error("Eindeutige nginx-Upload-Regel fehlt");
  const block = locations[0][0];
  if (!/^\s*alias\s+\/var\/www\/funnelflow\/uploads\/\s*;/m.test(block)
    && !/^\s*proxy_pass\s+http:\/\/127\.0\.0\.1:5000\s*;/m.test(block)) {
    throw new Error("Unerwartetes nginx-Upload-Verzeichnis");
  }
  const cleaned = block
    .replace(/^[ \t]*(?:alias|try_files|proxy_pass|proxy_http_version|proxy_set_header|proxy_cache|proxy_cache_bypass|proxy_no_cache|proxy_hide_header)\s+[^;]+;[^\n]*\n/gm, "")
    .replace(/^[ \t]*expires\s+[^;]+;[^\n]*\n/gm, "")
    .replace(/^[ \t]*add_header\s+Cache-Control\s+[^;]+;[^\n]*\n/gm, "");
  // Route uploads through the application startup gate as well. A stopped or
  // rejected restored app must never leave old files publicly served by nginx.
  const updated = cleaned.replace(/\s*\}$/, '\n        proxy_pass http://127.0.0.1:5000;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_cache off;\n        proxy_hide_header Cache-Control;\n        expires off;\n        add_header Cache-Control "no-store" always;\n    }');
  return config.slice(0, locations[0].index) + updated + config.slice(locations[0].index + block.length);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4) throw new Error("Quell- und Zieldatei erforderlich");
  await writeFile(process.argv[3], configureUploadCache(await readFile(process.argv[2], "utf8")));
}
