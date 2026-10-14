// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getLegalDocument } from "./legal-documents";
import { REGISTRATION_CONTRACT } from "./registration-contract";

describe("Vertragsarchiv", () => {
  // Bereits angenommene Inhalte dürfen auch bei späteren Textänderungen nicht wandern.
  it.each([
    ["2026-10-12", "agb", "a576dc475099235cfe8906dfdbbe87b89bc8baa6a2d5eb583014f9b1a04b369e"],
    ["2026-10-12", "avv", "5641eb81200604f3d21ae189f80d8c4579fbdea247595d07531b0255f50daa85"],
    ["2026-10-14", "agb", "f1a1b6f3bee4acc38b6975cce0a1f50e7b849923b357572e0b551597434d1f07"],
    ["2026-10-14", "avv", "fbe59e9bd2da8c2db7c85cc50072a9930af8b820723cfb0842fe66cb805d418e"],
  ])("hält die archivierte Fassung %s von %s unverändert", (version, name, hash) => {
    const document = getLegalDocument(version, name)!;
    expect(createHash("sha256").update(document.html).digest("hex")).toBe(hash);
  });

  it("liefert für die bei Registrierung angebotene Fassung beide Dokumente", () => {
    for (const name of ["agb", "avv"]) expect(getLegalDocument(REGISTRATION_CONTRACT.version, name)).not.toBeNull();
  });

  it.each([["unbekannt", "agb"], ["__proto__", "agb"], ["2026-10-12", "constructor"]])(
    "liefert keine Ersatzfassung für ungültige Archivpfade %s/%s", (version, name) => {
      expect(getLegalDocument(version, name)).toBeNull();
    },
  );
});
