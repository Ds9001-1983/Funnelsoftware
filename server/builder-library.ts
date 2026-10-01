import { and, desc, eq, ilike, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { contentTemplates, mediaAssets, mediaFolders } from "@shared/schema";
import { createContentTemplateSchema, updateContentTemplateSchema, libraryNameSchema, type ContentTemplate, type MediaAsset } from "@shared/builder-library";

export class LibraryError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const idSchema = z.coerce.number().int().positive();
const listSchema = z.object({ q: z.string().max(100).default(""), archived: z.enum(["true", "false"]).default("false"), cursor: idSchema.optional(), folderId: z.union([z.literal("none"), idSchema]).optional() }).strict();
const folderCreateSchema = z.object({ name: libraryNameSchema }).strict();
const folderUpdateSchema = folderCreateSchema.extend({ expectedVersion: z.number().int().positive() }).strict();
const assetUpdateSchema = z.object({ name: libraryNameSchema.optional(), folderId: z.number().int().positive().nullable().optional(), archived: z.boolean().optional(), expectedVersion: z.number().int().positive() }).strict()
  .refine(input => input.name !== undefined || input.folderId !== undefined || input.archived !== undefined, "Eine Änderung fehlt.");
const escapedSearch = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
const templateDto = (row: typeof contentTemplates.$inferSelect): ContentTemplate => ({ id: row.id, name: row.name, kind: row.kind, content: row.content, version: row.version, archivedAt: row.archivedAt?.toISOString() ?? null });
const mediaDto = (row: typeof mediaAssets.$inferSelect): MediaAsset => ({ id: row.id, name: row.name, originalName: row.originalName, url: `/uploads/${row.filename}`, mimeType: row.mimeType, bytes: row.bytes, width: row.width, height: row.height, folderId: row.folderId, version: row.version, archivedAt: row.archivedAt?.toISOString() ?? null });
const paged = <T extends { id: number }>(rows: T[]) => ({ items: rows.slice(0, 20), nextCursor: rows.length > 20 ? rows[19].id : null });

export async function listContentTemplates(userId: number, query: unknown) {
  const input = listSchema.omit({ folderId: true }).parse(query);
  return paged((await db.select().from(contentTemplates).where(and(eq(contentTemplates.userId, userId), input.archived === "true" ? isNotNull(contentTemplates.archivedAt) : isNull(contentTemplates.archivedAt), ilike(contentTemplates.name, escapedSearch(input.q)), input.cursor ? lt(contentTemplates.id, input.cursor) : undefined)).orderBy(desc(contentTemplates.id)).limit(21)).map(templateDto));
}
export async function createContentTemplate(userId: number, input: unknown) {
  const data = createContentTemplateSchema.parse(input);
  if (data.kind === "section" && data.content.page.layout?.sections.length !== 1) throw new LibraryError(400, "Eine Abschnittsvorlage muss genau einen Abschnitt enthalten.");
  const [row] = await db.insert(contentTemplates).values({ userId, ...data }).returning();
  return templateDto(row);
}
export async function updateContentTemplate(userId: number, id: number, input: unknown) {
  const { expectedVersion, archived, ...data } = updateContentTemplateSchema.parse(input);
  return db.transaction(async tx => {
    const scope = and(eq(contentTemplates.userId, userId), eq(contentTemplates.id, id));
    const [current] = await tx.select().from(contentTemplates).where(scope).for("update");
    if (!current) throw new LibraryError(404, "Vorlage nicht gefunden.");
    if (current.version !== expectedVersion) throw new LibraryError(409, "Die Vorlage wurde geändert. Lade die Liste neu.");
    if (current.kind === "section" && data.content && data.content.page.layout?.sections.length !== 1) throw new LibraryError(400, "Eine Abschnittsvorlage muss genau einen Abschnitt enthalten.");
    const [row] = await tx.update(contentTemplates).set({ ...data, version: current.version + 1, updatedAt: new Date(), ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}) }).where(scope).returning();
    return templateDto(row);
  });
}
export async function listMediaFolders(userId: number) {
  return db.select({ id: mediaFolders.id, name: mediaFolders.name, version: mediaFolders.version }).from(mediaFolders).where(eq(mediaFolders.userId, userId)).orderBy(mediaFolders.name);
}
export async function createMediaFolder(userId: number, input: unknown) {
  const data = folderCreateSchema.parse(input);
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`media-folders:${userId}`}))`);
    const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(mediaFolders).where(eq(mediaFolders.userId, userId));
    if (count >= 100) throw new LibraryError(400, "Du kannst bis zu 100 Medienordner anlegen.");
    const [row] = await tx.insert(mediaFolders).values({ userId, ...data }).returning({ id: mediaFolders.id, name: mediaFolders.name, version: mediaFolders.version });
    return row;
  });
}
export async function updateMediaFolder(userId: number, id: number, input: unknown) {
  const data = folderUpdateSchema.parse(input);
  const [row] = await db.update(mediaFolders).set({ name: data.name, version: sql`${mediaFolders.version} + 1` }).where(and(eq(mediaFolders.userId, userId), eq(mediaFolders.id, id), eq(mediaFolders.version, data.expectedVersion))).returning({ id: mediaFolders.id, name: mediaFolders.name, version: mediaFolders.version });
  if (!row) {
    const [owned] = await db.select({ id: mediaFolders.id }).from(mediaFolders).where(and(eq(mediaFolders.userId, userId), eq(mediaFolders.id, id)));
    throw new LibraryError(owned ? 409 : 404, owned ? "Der Ordner wurde geändert. Lade die Liste neu." : "Ordner nicht gefunden.");
  }
  return row;
}
export async function listMediaAssets(userId: number, query: unknown) {
  const input = listSchema.parse(query);
  return paged((await db.select().from(mediaAssets).where(and(eq(mediaAssets.userId, userId), input.archived === "true" ? isNotNull(mediaAssets.archivedAt) : isNull(mediaAssets.archivedAt), ilike(mediaAssets.name, escapedSearch(input.q)), input.cursor ? lt(mediaAssets.id, input.cursor) : undefined, input.folderId === "none" ? isNull(mediaAssets.folderId) : input.folderId ? eq(mediaAssets.folderId, input.folderId) : undefined)).orderBy(desc(mediaAssets.id)).limit(21)).map(mediaDto));
}
/** Called only after this authenticated request has written its own new file. */
export async function registerMediaAsset(userId: number, file: { filename: string; originalName: string; bytes: number; width: number; height: number }) {
  const originalName = file.originalName.replace(/[\u0000-\u001f\u007f/\\]/g, "_").slice(0, 255) || "Bild";
  const [row] = await db.insert(mediaAssets).values({ userId, ...file, originalName, name: originalName.slice(0, 100), mimeType: "image/webp" }).returning();
  return mediaDto(row);
}
export async function updateMediaAsset(userId: number, id: number, input: unknown) {
  const { expectedVersion, archived, ...data } = assetUpdateSchema.parse(input);
  return db.transaction(async tx => {
    const scope = and(eq(mediaAssets.userId, userId), eq(mediaAssets.id, id));
    const [current] = await tx.select().from(mediaAssets).where(scope).for("update");
    if (!current) throw new LibraryError(404, "Bild nicht gefunden.");
    if (current.version !== expectedVersion) throw new LibraryError(409, "Das Bild wurde geändert. Lade die Liste neu.");
    if (data.folderId !== undefined && data.folderId !== null) {
      const [folder] = await tx.select({ id: mediaFolders.id }).from(mediaFolders).where(and(eq(mediaFolders.userId, userId), eq(mediaFolders.id, data.folderId)));
      if (!folder) throw new LibraryError(404, "Ordner nicht gefunden.");
    }
    const [row] = await tx.update(mediaAssets).set({ ...data, version: current.version + 1, updatedAt: new Date(), ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}) }).where(scope).returning();
    return mediaDto(row);
  });
}
