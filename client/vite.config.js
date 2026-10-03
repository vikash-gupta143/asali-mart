import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router")) return "router";
            if (id.includes("react-dom") || id.includes("react/")) return "react";
            if (id.includes("react-icons")) return "icons";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("axios")) return "axios";
            return "vendor";
          }
        },
      },
    },
  },
});