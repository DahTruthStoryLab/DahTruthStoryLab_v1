// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      // Allow JSX in .js files too
      include: /\.(jsx|js|tsx|ts)$/,
    }),
  ],
  resolve: {
    alias: {
      // Always use the browser build of mammoth in the browser bundle
      mammoth: "mammoth/mammoth.browser.js",
    },
  },
  optimizeDeps: {
    // Pre-bundle the browser build so dev/build can resolve it cleanly
    include: ["mammoth/mammoth.browser.js"],
  },
  build: {
    target: "es2020",
  },
});
