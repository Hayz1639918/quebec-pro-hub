import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/visual-polish.css";
import "./i18n/config"; // Import i18n configuration
import { CHUNK_RELOAD_KEY } from "./lib/lazy-with-reload";

// Self-heal stale deployments: when Vite fails to preload a chunk (the asset
// hashes changed after a new deploy but the browser still holds an old
// index.html), reload once to pull the fresh build. The sessionStorage guard
// prevents an infinite reload loop on a genuinely broken build.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    /* sessionStorage unavailable: fall through to reload anyway */
  }
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
