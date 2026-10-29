import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        devtools: resolve(import.meta.dirname, "src/devtools/devtools.html"),
        panel: resolve(import.meta.dirname, "src/panel/panel.html"),
      },
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
