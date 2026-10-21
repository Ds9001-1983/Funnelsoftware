import path from "node:path";
import { promises as fs } from "node:fs";
import { and, eq, isNull, sql } from "drizzle-orm";
import { bugReports, mediaAssets, ownedUploads, users } from "@shared/schema";
import { db } from "./db";

type Area = "public" | "support";
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export class AccountFileError extends Error {
  constructor(message = "Dateien konnten nicht vollständig gelöscht werden. Das Konto bleibt bestehen; bitte erneut versuchen oder den Support kontaktieren.") { super(message); }
}

export function accountFilePath(root: string, area: Area, filename: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/.test(filename) || filename.includes("..")
    || (area !== "public" && area !== "support")) throw new AccountFileError();
  return path.join(root, area === "public" ? "uploads" : "private-uploads/bug-reports", filename);
}

/** Reserve the owner durably BEFORE writing. Even a failed cleanup remains
 * attributable. Hold a user key lock while writing so deletion cannot finish
 * between the authorization check and the actual filesystem write. */
export async function withOwnedUpload<T>(userId: number, area: Area, filename: string, write: (tx: Transaction) => Promise<T>): Promise<T> {
  accountFilePath(process.cwd(), area, filename);
  await db.insert(ownedUploads).values({ filename, userId, area });
  return db.transaction(async tx => {
    const [user] = await tx.select({ id: users.id }).from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt))).for("key share");
    if (!user) throw new Error("Konto nicht mehr verfügbar");
    return write(tx);
  });
}

/** Files go first; the user, file ownership and all FK cascades commit only
 * afterwards. On failure, ownership survives for retry. Previously removed
 * files are harmless ENOENTs. Never recurse through a directory or follow a
 * filename supplied by a client when selecting which account to delete. */
export async function deleteAccountWithFiles(userId: number, options: {
  root?: string;
  removeFile?: (file: string) => Promise<void>;
} = {}): Promise<boolean> {
  const root = options.root ?? process.cwd();
  const remove = options.removeFile ?? fs.unlink;
  return db.transaction(async tx => {
    const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
    if (!user) return false;
    const registered = await tx.select({ filename: ownedUploads.filename, area: ownedUploads.area }).from(ownedUploads).where(eq(ownedUploads.userId, userId));
    const images = await tx.select({ filename: mediaAssets.filename }).from(mediaAssets).where(eq(mediaAssets.userId, userId));
    const reports = await tx.select({ screenshot: bugReports.screenshotPath, attachment: bugReports.attachmentPath }).from(bugReports).where(eq(bugReports.userId, userId));
    const files: { filename: string; area: Area }[] = [
      ...registered,
      ...images.map(file => ({ ...file, area: "public" as const })),
      ...reports.flatMap(report => [report.screenshot, report.attachment].filter((name): name is string => !!name).map(filename => ({ filename, area: "support" as const }))),
    ];
    // Validate every path before removing the first file.
    const paths = Array.from(new Set(files.map(file => accountFilePath(root, file.area, file.filename))));
    for (const file of paths) {
      try { await remove(file); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new AccountFileError();
      }
    }
    await tx.execute(sql`DELETE FROM "session" WHERE sess->'passport'->>'user' = ${String(userId)}`);
    await tx.delete(users).where(eq(users.id, userId));
    return true;
  });
}

/** Used after successful support-file cleanup. Missing files count as removed;
 * other filesystem errors must preserve the reference for a later retry. */
export async function removeSupportFile(filename: string): Promise<void> {
  const file = accountFilePath(process.cwd(), "support", filename);
  try { await fs.unlink(file); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  await db.delete(ownedUploads).where(and(eq(ownedUploads.filename, filename), eq(ownedUploads.area, "support")));
}
