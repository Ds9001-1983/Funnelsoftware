import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import pg from "pg";
import sharp from "sharp";
import { E2E_DATABASE_URL } from "./helpers/env";
import { registerAndVerify, getCsrfToken } from "./helpers/api";
import { closePool } from "./helpers/db";

test.afterAll(closePool);
test("Kontolöschung entfernt Bild, Audio und private Anhänge; fremde Dateien bleiben erhalten", async ({ page, browser, baseURL }) => {
  const db = new pg.Client({ connectionString: E2E_DATABASE_URL }); await db.connect();
  const admin = await browser.newContext({ baseURL }), victim = await browser.newContext({ baseURL });
  const ids: number[] = [], paths: string[] = [];
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#224466" } }).png().toBuffer();
  const remember = async (email: string) => {
    const id = (await db.query("SELECT id FROM users WHERE email=$1", [email])).rows[0].id as number;
    ids.push(id); return id;
  };
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    const own = await registerAndVerify(page.request), ownId = await remember(own.email);
    const headers = { "X-CSRF-Token": await getCsrfToken(page.request) };
    const img = await page.request.post("/api/uploads", { headers, multipart: { file: { name: "synthetic.png", mimeType: "image/png", buffer: image } } });
    expect(img.status()).toBe(200); const imgFile = await img.json(); paths.push(path.join("uploads", imgFile.filename));
    const audio = await page.request.post("/api/uploads/audio", { headers, multipart: { file: { name: "synthetic.wav", mimeType: "audio/wav", buffer: Buffer.from("RIFF0000WAVEfmt synthetic") } } });
    expect(audio.status()).toBe(200); const audioFile = await audio.json(); paths.push(path.join("uploads", audioFile.filename));
    const reportResponse = await page.request.post("/api/bug-reports", { headers, multipart: {
      description: "Synthetische Meldung für die Löschprüfung", pageUrl: "/settings",
      screenshot: { name: "screenshot.png", mimeType: "image/png", buffer: image },
      attachment: { name: "attachment.png", mimeType: "image/png", buffer: image },
    } });
    expect(reportResponse.status()).toBe(201); const report = await reportResponse.json();
    const stored = (await db.query("SELECT screenshot_path,attachment_path FROM bug_reports WHERE id=$1", [report.id])).rows[0];
    paths.push(...[stored.screenshot_path, stored.attachment_path].map(name => path.join("private-uploads", "bug-reports", name)));
    for (const file of paths) await expect(fs.stat(file)).resolves.toBeDefined();
    for (const url of [imgFile.url, audioFile.url]) {
      const response = await page.request.get(url); expect(response.status()).toBe(200); expect(response.headers()["cache-control"]).toBe("no-store");
      expect(response.headers()["cross-origin-resource-policy"]).toBe("cross-origin");
    }
    // A customer's domain may embed an absolute upload URL from the platform.
    const embedding = new URL("/embedding-test", baseURL);
    embedding.hostname = embedding.hostname === "localhost" ? "127.0.0.1" : "localhost";
    // Both test origins are loopback; Chromium asks separately for local
    // network access when the synthetic embedding document is intercepted.
    await page.context().grantPermissions(["local-network-access"], { origin: embedding.origin });
    await page.route(embedding.href, route => route.fulfill({ contentType: "text/html", body: `<img id="public-media" src="${new URL(imgFile.url, baseURL).href}">` }));
    await page.goto(embedding.href);
    await expect(page.locator("#public-media")).toHaveJSProperty("naturalWidth", 2);
    expect((await db.query("SELECT filename FROM owned_uploads WHERE user_id=$1", [ownId])).rows).toHaveLength(4);

    const foreign = await registerAndVerify(admin.request), foreignId = await remember(foreign.email);
    const adminHeaders = { "X-CSRF-Token": await getCsrfToken(admin.request) };
    const otherUpload = await admin.request.post("/api/uploads", { headers: adminHeaders, multipart: { file: { name: "foreign.png", mimeType: "image/png", buffer: image } } });
    expect(otherUpload.status()).toBe(200); const otherFile = await otherUpload.json();
    paths.push(path.join("uploads", otherFile.filename));

    const denied = await page.request.delete("/api/auth/account", { headers, data: { password: "incorrect" } });
    expect(denied.status()).toBe(400); expect((await page.request.get(imgFile.url)).status()).toBe(200);
    await page.goto("/settings");
    await page.locator("#delete-password").fill(own.password);
    await page.locator("#delete-confirm").fill("LÖSCHEN");
    const deleted = page.waitForResponse(response => response.url().endsWith("/api/auth/account") && response.request().method() === "DELETE");
    await page.getByRole("button", { name: "Konto endgültig löschen", exact: true }).click();
    expect((await deleted).status()).toBe(200);
    for (const file of paths.slice(0, 4)) await expect(fs.stat(file)).rejects.toMatchObject({ code: "ENOENT" });
    for (const url of [imgFile.url, audioFile.url]) expect((await page.request.get(url)).status()).toBe(404);
    for (const table of ["users", "media_assets", "owned_uploads", "bug_reports"]) {
      expect((await db.query(`SELECT 1 FROM ${table} WHERE ${table === "users" ? "id" : "user_id"}=$1`, [ownId])).rows).toEqual([]);
    }
    expect((await db.query("SELECT sid FROM session WHERE sess->'passport'->>'user'=$1", [String(ownId)])).rows).toEqual([]);
    expect((await admin.request.get(otherFile.url)).status()).toBe(200);
    await expect(fs.stat(paths[4])).resolves.toBeDefined();

    // Der Admin-Pfad benutzt dieselbe Bereinigung; keine echten Konten nötig.
    await db.query("UPDATE users SET is_admin=true WHERE id=$1", [foreignId]);
    const target = await registerAndVerify(victim.request), targetId = await remember(target.email);
    const targetUpload = await victim.request.post("/api/uploads", { headers: { "X-CSRF-Token": await getCsrfToken(victim.request) }, multipart: { file: { name: "target.png", mimeType: "image/png", buffer: image } } });
    expect(targetUpload.status()).toBe(200); const targetFile = await targetUpload.json(); paths.push(path.join("uploads", targetFile.filename));
    expect((await admin.request.delete(`/api/admin/users/${targetId}`, { headers: adminHeaders })).status()).toBe(200);
    expect((await admin.request.get(targetFile.url)).status()).toBe(404);
    await expect(fs.stat(paths[5])).rejects.toMatchObject({ code: "ENOENT" });
    expect((await admin.request.get(otherFile.url)).status()).toBe(200);
  } finally {
    for (const file of paths) await fs.unlink(file).catch(() => {});
    if (ids.length) await db.query("DELETE FROM users WHERE id=ANY($1::int[])", [ids]);
    await db.end(); await admin.close(); await victim.close();
  }
});
