import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const chunkGroups: Record<string, string[]> = {
  "vendor-react": ["react", "react-dom", "react-router-dom"],
  "vendor-ui": [
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-popover",
    "@radix-ui/react-select",
    "@radix-ui/react-tabs",
    "@radix-ui/react-tooltip",
    "@radix-ui/react-toast",
    "@radix-ui/react-accordion",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-avatar",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-label",
    "@radix-ui/react-progress",
    "@radix-ui/react-radio-group",
    "@radix-ui/react-scroll-area",
    "@radix-ui/react-separator",
    "@radix-ui/react-slider",
    "@radix-ui/react-slot",
    "@radix-ui/react-switch",
    "@radix-ui/react-toggle",
    "@radix-ui/react-toggle-group",
  ],
  "vendor-data": [
    "@tanstack/react-query",
    "@supabase/supabase-js",
    "zod",
    "@hookform/resolvers",
    "react-hook-form",
  ],
  "vendor-utils": ["date-fns", "clsx", "tailwind-merge", "class-variance-authority"],
  "vendor-i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
  "vendor-pdf": ["@react-pdf/renderer"],
  "vendor-maps": ["leaflet", "react-leaflet"],
  "vendor-charts": ["recharts"],
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:5174",
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit (optional)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          for (const [chunkName, dependencies] of Object.entries(chunkGroups)) {
            if (dependencies.some((dependency) => id.includes(`/node_modules/${dependency}/`))) {
              return chunkName;
            }
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: true,
    // Les tests E2E (dossier e2e/) appartiennent à Playwright, pas à Vitest.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
    coverage: {
      reporter: ["text", "lcov"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
    },
  },
}));
