import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated, getUserId } from "./auth";
import { BrandStyleError, createBrandStyle, listBrandStyles, updateBrandStyle } from "./brand-styles";

export function registerBrandStyleRoutes(app: Express) {
  for (const method of ["get", "post", "patch"] as const) {
    app[method](method === "patch" ? "/api/brand-styles/:id" : "/api/brand-styles", isAuthenticated, async (req, res) => {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });
      try {
        if (method === "get") return res.json(await listBrandStyles(userId));
        if (method === "post") return res.status(201).json(await createBrandStyle(userId, req.body));
        const id = z.coerce.number().int().positive().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ error: "Ungültiger Markenstil" });
        return res.json(await updateBrandStyle(userId, id.data, req.body));
      } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Bitte prüfe Name, Farben, Schriftart und Designwerte.", details: error.errors });
        if (error instanceof BrandStyleError) return res.status(error.status).json({ error: error.message });
        console.error("Markenstil-Anfrage fehlgeschlagen", error instanceof Error ? error.name : "UnknownError");
        return res.status(500).json({ error: "Markenstile konnten nicht verarbeitet werden." });
      }
    });
  }
}
