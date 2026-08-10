import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/english-companion-os/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { charts: ["recharts"] }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
});
