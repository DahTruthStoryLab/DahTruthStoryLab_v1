// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // ok for local & Codespaces
    port: 5174,
    strictPort: true,
    proxy: {
      // DEV ONLY: anything starting with /api goes to your API Gateway /prod
      "/api": {
        target: "https://ud9loepble.execute-api.us-east-1.amazonaws.com/prod",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, ""), // /api/assistant -> /assistant
      },
    },
  },
});
