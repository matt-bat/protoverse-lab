import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    cssMinify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
          if (id.includes("node_modules/three") || id.includes("node_modules/@react-three")) return "three";
          if (id.includes("node_modules/lucide-react")) return "icons";
          if (id.includes("node_modules")) return "vendor";
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
