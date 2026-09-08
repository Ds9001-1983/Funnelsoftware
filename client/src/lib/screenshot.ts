/**
 * Bildschirmaufnahme der aktuellen Seite für Fehlermeldungen.
 *
 * `html-to-image` rendert das echte DOM über ein SVG-`foreignObject`, kommt
 * damit mit unseren Tailwind-/Radix-Styles zurecht und wird erst beim Klick
 * nachgeladen — im Startbundle steckt davon nichts.
 *
 * Bewusst NICHT `getDisplayMedia`: das gibt es auf iOS Safari nicht, und der
 * Nutzer könnte versehentlich ein fremdes Fenster freigeben.
 */

/** Nach dieser Zeit brechen wir ab — lieber kein Bild als ein hängender Dialog. */
const CAPTURE_TIMEOUT_MS = 6000;
/** Breite, auf die das Bild vor dem Versand herunterskaliert wird. */
const MAX_WIDTH = 1600;

/** Setzt der Aufnahme eine Frist. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Zeitüberschreitung")), ms)),
  ]);
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob | null> {
  const scale = canvas.width > MAX_WIDTH ? MAX_WIDTH / canvas.width : 1;
  if (scale === 1) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
  }
  const scaled = document.createElement("canvas");
  scaled.width = Math.round(canvas.width * scale);
  scaled.height = Math.round(canvas.height * scale);
  scaled.getContext("2d")?.drawImage(canvas, 0, 0, scaled.width, scaled.height);
  return new Promise((resolve) => scaled.toBlob(resolve, "image/webp", 0.8));
}

/**
 * Nimmt die aktuelle Seite auf. Liefert `null`, wenn es nicht klappt — der
 * Aufrufer bietet dann den Datei-Anhang als Weg an.
 *
 * Vor der Aufnahme bekommt `<html>` die Klasse `bug-mask-active`. Elemente mit
 * `data-bug-mask` (z. B. die Lead-Tabelle) werden dadurch unscharf, damit
 * Kontaktdaten unserer Kunden nicht im Bild landen.
 */
export async function captureViewport(): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const root = document.documentElement;
  root.classList.add("bug-mask-active");
  try {
    const { toCanvas } = await import("html-to-image");
    const canvas = await withTimeout(
      toCanvas(root, {
        // Der Melde-Knopf selbst gehört nicht ins Bild.
        filter: (node) => !(node instanceof HTMLElement && node.dataset.bugWidget !== undefined),
        // Bilder von fremden Domains würden das Canvas unbrauchbar machen ("tainted").
        imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        pixelRatio: 1,
        cacheBust: false,
        backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
      }),
      CAPTURE_TIMEOUT_MS,
    );
    return await canvasToWebp(canvas);
  } catch (error) {
    console.warn("[bug-report] Screenshot nicht möglich:", error);
    return null;
  } finally {
    root.classList.remove("bug-mask-active");
  }
}
