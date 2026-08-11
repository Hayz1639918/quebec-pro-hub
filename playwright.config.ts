import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

/**
 * Tests E2E des routes publiques (aucun compte requis).
 *
 * Lancement : `npm run test:e2e` — construit l'app avec un environnement
 * Supabase factice (aucun appel réseau réel n'aboutit ; les tests ne couvrent
 * que le rendu, la navigation, les formulaires et le responsive) puis la sert
 * via `vite preview`.
 *
 * Sur les environnements où Chromium est pré-installé hors du cache Playwright
 * (ex. runner cloud : /opt/pw-browsers/chromium), l'exécutable est réutilisé
 * au lieu d'être retéléchargé.
 */
const PREINSTALLED_CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || "/opt/pw-browsers/chromium";
const executablePath = fs.existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined;

// Environnement Supabase factice : l'URL pointe vers un domaine inexistant,
// les tests publics n'ont besoin d'aucune donnée réelle.
const STUB_ENV = {
  VITE_SUPABASE_URL: "https://stub.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "stub-publishable-key",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ...process.env, ...STUB_ENV },
  },
});
