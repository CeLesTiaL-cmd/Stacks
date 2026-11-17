import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 600,
    rollupOptions: { output: { manualChunks(id) {
      if (!id.includes("node_modules")) return;
      if (/node_modules\/(@firebase|firebase)\//.test(id)) return "vendor-firebase";
      if (/node_modules\/(motion|motion-dom|motion-utils|framer-motion)\//.test(id)) return "vendor-motion";
      if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(id)) return "vendor-react";
    } } },
  },
});
