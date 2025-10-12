// vite.config.js (ESM)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // so Codespaces can expose it
    port: 5174,       // matches the command we run
    strictPort: true, // fail fast if taken
  },
});
