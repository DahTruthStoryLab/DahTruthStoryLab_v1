import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react()
  ],
  build: {
    minify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/chunk-[hash].js',
      }
    }
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://ud9loepble.execute-api.us-east-1.amazonaws.com/prod",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, "")
      }
    }
  }
});
