import type { Express } from "express";
import { createHash } from "node:crypto";
import { getLegalDocument } from "@shared/legal-documents";
import { REGISTRATION_CONTRACT, type RegistrationContract } from "@shared/registration-contract";
import { isAuthenticated } from "./auth";

export function createRegistrationContract(businessName: string): RegistrationContract {
  const version = REGISTRATION_CONTRACT.version;
  const hash = (name: "agb" | "avv") => ({
    sha256: createHash("sha256").update(getLegalDocument(version, name)!.html).digest("hex"),
  });
  return {
    ...REGISTRATION_CONTRACT,
    businessName,
    acceptedAt: new Date().toISOString(),
    documents: { agb: hash("agb"), avv: hash("avv") },
  };
}

export function registerContractRoutes(app: Express) {
  app.get("/api/legal/:version/:document", (req, res) => {
    const document = getLegalDocument(String(req.params.version), String(req.params.document));
    if (!document) return res.status(404).json({ error: "Vertragsfassung nicht gefunden" });
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (req.query.download === "1") {
      res.attachment(`trichterwerk-${req.params.document}-${req.params.version}.html`);
    }
    return res.type("html").send(document.html);
  });

  app.get("/api/auth/registration-contract", isAuthenticated, (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const contract = req.user!.registrationContract;
    if (!contract) return res.status(404).json({ error: "Für dieses Konto liegt kein digitaler Registrierungsnachweis vor." });
    const agb = getLegalDocument(contract.version, "agb");
    const avv = getLegalDocument(contract.version, "avv");
    if (!agb || !avv) return res.status(500).json({ error: "Vertragsfassung derzeit nicht verfügbar" });
    res.attachment(`trichterwerk-registrierung-${contract.version}.json`);
    return res.json({ ...contract, accountId: req.user!.id, documentContents: { agb: agb.html, avv: avv.html } });
  });
}
