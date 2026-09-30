import { beforeEach, describe, expect, it, vi } from "vitest";
import { funnelPageSchema, type Funnel } from "@shared/schema";
import { documentFromFunnel, type WriteControl } from "@shared/funnel-document";

const mocked = vi.hoisted(() => ({ transaction: vi.fn(), select: vi.fn(), insert: vi.fn(), update: vi.fn(), execute: vi.fn() }));
vi.mock("./db", () => ({ db: mocked }));
vi.mock("./auth", () => ({ hasProFeatures: () => true }));
import { publishedDocument, writeFunnel } from "./funnel-revisions";

const theme = { primaryColor: "#123456", backgroundColor: "#ffffff", textColor: "#111111", fontFamily: "Inter" };
let row: Funnel;
let results: unknown[][];
let revisions: Record<string, unknown>[];
beforeEach(() => {
  vi.clearAllMocks();
  row = { id: 1, uuid: "funnel", userId: 1, name: "Funnel", status: "draft", documentVersion: 1, editVersion: 0,
    editorProtocol: true, publishedRevisionId: null, theme, pages: [funnelPageSchema.parse({ id: "p", type: "contact", title: "Kontakt", elements: [{ id: "input", type: "input" }] })],
    abTests: [], createdAt: new Date(), updatedAt: new Date(), views: 12, leads: 5 } as Funnel;
  results = [];
  revisions = [];
  mocked.transaction.mockImplementation(async callback => callback(mocked));
  mocked.select.mockImplementation(() => ({ from: () => ({ where: () => {
    const result = results.shift();
    if (!result) throw new Error("Unerwarteter Datenbankzugriff im Test");
    return Object.assign(Promise.resolve(result), { for: () => Promise.resolve(result) });
  } }) }));
  mocked.insert.mockImplementation(() => ({ values: (content: Record<string, unknown>) => {
    revisions.push(content);
    return { returning: async () => [{ id: 10, ...content }], onConflictDoNothing: async () => undefined };
  } }));
  mocked.update.mockImplementation(() => ({ set: (values: Partial<Funnel>) => ({ where: () => ({ returning: async () => [{ ...row, ...values }] }) }) }));
});
const control = (documentVersion: 1 | 2 = 1, publish = false): WriteControl => ({ documentVersion, expectedVersion: 0, mutationId: crypto.randomUUID(), publish });
function layoutPages() {
  const pages = structuredClone(row.pages);
  pages[0].layout = { version: 1, width: "wide", sections: [{ id: "s", columns: [{ id: "c", elementIds: ["input"] }] }] };
  return pages;
}

describe("Versionsschutz beim Speichern und Wiederherstellen", () => {
  it("lehnt einen alten Editor vor jeder Änderung am v2-Funnel ab", async () => {
    row.documentVersion = 2;
    results = [[row]];
    await expect(writeFunnel(1, 1, { name: "Verändert" }, control())).rejects.toMatchObject({ status: 409, code: "EDITOR_UPDATE_REQUIRED" });
    expect(mocked.insert).not.toHaveBeenCalled();
    expect(mocked.update).not.toHaveBeenCalled();
  });

  it("lehnt unbekannte Schreibprotokolle auch innerhalb des Storage-Aufrufs ab", async () => {
    results = [[row]];
    await expect(writeFunnel(1, 1, {}, { ...control(), documentVersion: 99 } as unknown as WriteControl)).rejects.toMatchObject({ code: "EDITOR_UPDATE_REQUIRED" });
    expect(mocked.insert).not.toHaveBeenCalled();
  });

  it("schaltet alte flache Inhalte bei einem gewöhnlichen Save nicht um, auch mit null-A/B-Feld", async () => {
    Object.assign(row, { abTests: null });
    results = [[row], []];
    const saved = await writeFunnel(1, 1, { name: "Entwurf" }, control());
    expect(saved?.documentVersion).toBe(1);
    expect(saved?.leads).toBe(5);
    expect(revisions[0].content).toMatchObject({ version: 1, abTests: [] });
  });

  it("verlangt v2-Unterstützung für neue Layouts und erhöht dann die Dokumentversion", async () => {
    results = [[row], []];
    await expect(writeFunnel(1, 1, { pages: layoutPages() }, control())).rejects.toMatchObject({ code: "EDITOR_UPDATE_REQUIRED" });
    expect(mocked.insert).not.toHaveBeenCalled();
    results = [[row], []];
    const saved = await writeFunnel(1, 1, { pages: layoutPages() }, control(2));
    expect(saved?.documentVersion).toBe(2);
    expect(revisions[0].content).toMatchObject({ version: 2, pages: layoutPages() });
  });

  it("blockiert die Veröffentlichung mit fehlenden Layout-Referenzen vor dem Snapshot", async () => {
    const pages = layoutPages();
    pages[0].layout!.sections[0].columns[0].elementIds = [];
    results = [[row], [], [{ emailVerifiedAt: new Date() }]];
    await expect(writeFunnel(1, 1, { pages }, control(2, true))).rejects.toMatchObject({ status: 400, code: "INVALID_LAYOUT" });
    expect(mocked.insert).not.toHaveBeenCalled();
    expect(mocked.update).not.toHaveBeenCalled();
  });

  it("lässt einen alten Editor keine neuere Inhaltsversion wiederherstellen", async () => {
    const content = documentFromFunnel({ ...row, documentVersion: 2 });
    results = [[row], [], [{ content }]];
    await expect(writeFunnel(1, 1, {}, control(), 10)).rejects.toMatchObject({ code: "EDITOR_UPDATE_REQUIRED" });
    expect(mocked.insert).not.toHaveBeenCalled();
  });

  it("erhält v2 beim Wiederherstellen und lässt Live-Verweis und Lead-Zähler bestehen", async () => {
    row.status = "published";
    row.publishedRevisionId = 8;
    const content = documentFromFunnel({ ...row, name: "Wiederhergestellt", documentVersion: 2 });
    results = [[row], [], [{ content }]];
    const restored = await writeFunnel(1, 1, {}, control(2), 10);
    expect(restored).toMatchObject({ documentVersion: 2, publishedRevisionId: 8, leads: 5, views: 12, name: "Wiederhergestellt" });
    expect(revisions[0].content).not.toHaveProperty("leads");
  });

  it("liefert die Version des Live-Inhalts unabhängig vom neueren Entwurf", async () => {
    row.status = "published";
    row.publishedRevisionId = 8;
    const content = documentFromFunnel(row);
    row.documentVersion = 2;
    row.pages = layoutPages();
    results = [[{ content }]];
    expect(await publishedDocument(row)).toMatchObject({ documentVersion: 1, pages: content.pages });
    results = [[{ content: { ...content, version: 2 } }]];
    expect((await publishedDocument(row))?.documentVersion).toBe(2);
    results = [[{ content: { ...content, version: 99 } }]];
    expect(await publishedDocument(row)).toBeUndefined();
  });
});
