import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { componentTagger } from "lovable-tagger";

const BUILD_ID = new Date().toISOString();
const BUILD_HASH = crypto
  .createHash("sha256")
  .update(BUILD_ID + Math.random().toString())
  .digest("hex")
  .slice(0, 12);

// Plugin: emite /version.json no build com buildId + hash + timestamp.
// Esses campos são usados pelo cliente (UpdateAvailableBanner / index.html)
// para detectar deploys novos e forçar reload de cache.
function emitVersionJson() {
  return {
    name: "emit-version-json",
    apply: "build" as const,
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      try {
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(
          path.join(outDir, "version.json"),
          JSON.stringify({
            buildId: BUILD_ID,
            hash: BUILD_HASH,
            builtAt: BUILD_ID,
          }),
        );
      } catch {
        // best-effort
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    emitVersionJson(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
