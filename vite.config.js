<<<<<<< HEAD
/// vite.config.js (ESM, clean)
=======
// vite.config.js (ESM, clean)
>>>>>>> d9208c5 (Lock clean vite.config.js; track pnpm-lock; update ignore)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
});

