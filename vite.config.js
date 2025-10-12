// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001", // your Express port
    },
  },
});

export default defineConfig({
  plugins: [
    react({
      include: /\.(jsx|js|tsx|ts)$/,
    }),
  ],
  build: { target: "es2020" },
});
