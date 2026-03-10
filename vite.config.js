import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        navigateFallback: null
      },
      manifest: {
        name: "DahTruth StoryLab",
        short_name: "StoryLab",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#1e3a5f",
        theme_color: "#1e3a5f",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
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
