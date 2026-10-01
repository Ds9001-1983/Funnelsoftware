import type { Express, Request, Response } from "express";
import { z } from "zod";
import { getUserId, isAuthenticated, requireVerifiedEmail } from "./auth";
import { createContentTemplate, createMediaFolder, LibraryError, listContentTemplates, listMediaAssets, listMediaFolders, updateContentTemplate, updateMediaAsset, updateMediaFolder } from "./builder-library";

export function registerBuilderLibraryRoutes(app: Express) {
  const register = (method: "get" | "post" | "patch", path: string, action: (userId: number, req: Request) => Promise<unknown>) => {
    app[method](path, isAuthenticated, ...(method === "get" ? [] : [requireVerifiedEmail]), async (req: Request, res: Response) => {
      if (process.env.BUILDER_LIBRARY_EDITOR !== "true") return res.status(403).json({ error: "Die Bibliothek ist noch nicht freigeschaltet." });
      try { return res.status(method === "post" ? 201 : 200).json(await action(getUserId(req)!, req)); }
      catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || "Ungültige Bibliotheksdaten." });
        if (error instanceof LibraryError) return res.status(error.status).json({ error: error.message });
        console.error("Bibliotheksanfrage fehlgeschlagen", error instanceof Error ? error.name : "UnknownError");
        return res.status(500).json({ error: "Die Bibliothek konnte nicht verarbeitet werden." });
      }
    });
  };
  const id = (req: Request) => z.coerce.number().int().positive().parse(req.params.id);
  register("get", "/api/library/templates", (userId, req) => listContentTemplates(userId, req.query));
  register("post", "/api/library/templates", (userId, req) => createContentTemplate(userId, req.body));
  register("patch", "/api/library/templates/:id", (userId, req) => updateContentTemplate(userId, id(req), req.body));
  register("get", "/api/library/media", (userId, req) => listMediaAssets(userId, req.query));
  register("patch", "/api/library/media/:id", (userId, req) => updateMediaAsset(userId, id(req), req.body));
  register("get", "/api/library/folders", userId => listMediaFolders(userId));
  register("post", "/api/library/folders", (userId, req) => createMediaFolder(userId, req.body));
  register("patch", "/api/library/folders/:id", (userId, req) => updateMediaFolder(userId, id(req), req.body));
}
