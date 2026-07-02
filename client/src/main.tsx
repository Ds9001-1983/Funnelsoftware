import { createRoot } from "react-dom/client";
import App from "./App";
import { tryRecoverFromChunkError } from "./lib/chunk-reload";
import "./index.css";
// UI-Font selbst gehostet (DSGVO) — weitere Theme-Fonts lädt lib/font-loader on demand
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

// Nach einem Deploy existieren die alten Hash-Chunks nicht mehr — offene Tabs
// würden beim nächsten Routenwechsel mit einem fehlgeschlagenen Dynamic Import
// crashen. Vite meldet das als "vite:preloadError": einmal automatisch neu
// laden (guarded), damit der Browser den frischen Build holt. Greift der
// Guard, läuft der Fehler regulär in die ErrorBoundary.
window.addEventListener("vite:preloadError", (event) => {
  console.warn(
    "[preload] Chunk-Load fehlgeschlagen — vermutlich neuer Deploy:",
    event.payload,
  );
  if (tryRecoverFromChunkError()) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
