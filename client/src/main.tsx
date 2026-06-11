import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// UI-Font selbst gehostet (DSGVO) — weitere Theme-Fonts lädt lib/font-loader on demand
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

createRoot(document.getElementById("root")!).render(<App />);
