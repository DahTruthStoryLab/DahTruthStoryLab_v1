// vite.config.js (ESM, clean)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // allow Codespaces/Amplify to expose
    port: 5174,   // matches the dev script we run
    strictPort: true, // fail fast if taken
  },
});
