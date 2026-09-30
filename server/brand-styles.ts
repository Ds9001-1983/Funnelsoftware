import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import { brandStyles } from "@shared/schema";
import { createBrandStyleSchema, updateBrandStyleSchema, type BrandStyle } from "@shared/funnel-design";

export class BrandStyleError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const active = (userId: number, id?: number) => and(eq(brandStyles.userId, userId), isNull(brandStyles.archivedAt), id === undefined ? undefined : eq(brandStyles.id, id));
function dto(row: typeof brandStyles.$inferSelect): BrandStyle {
  return { id: row.id, name: row.name, theme: row.theme, version: row.version, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
export async function listBrandStyles(userId: number) {
  return (await db.select().from(brandStyles).where(active(userId)).orderBy(desc(brandStyles.updatedAt))).map(dto);
}
export async function createBrandStyle(userId: number, input: unknown) {
  const data = createBrandStyleSchema.parse(input);
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`brand-styles:${userId}`}))`);
    const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(brandStyles).where(active(userId));
    if (count >= 100) throw new BrandStyleError(400, "Du kannst bis zu 100 aktive Markenstile speichern. Archiviere zuerst einen alten Stil.");
    const [row] = await tx.insert(brandStyles).values({ userId, ...data }).returning();
    return dto(row);
  });
}
export async function updateBrandStyle(userId: number, id: number, input: unknown) {
  const { expectedVersion, archived, ...data } = updateBrandStyleSchema.parse(input);
  return db.transaction(async tx => {
    const [current] = await tx.select().from(brandStyles).where(active(userId, id)).for("update");
    if (!current) throw new BrandStyleError(404, "Markenstil nicht gefunden.");
    if (current.version !== expectedVersion) throw new BrandStyleError(409, "Der Markenstil wurde zwischenzeitlich geändert. Lade die Liste neu und prüfe die aktuelle Version.");
    const [row] = await tx.update(brandStyles).set({ ...data, version: current.version + 1, updatedAt: new Date(), ...(archived ? { archivedAt: new Date() } : {}) }).where(active(userId, id)).returning();
    return dto(row);
  });
}
