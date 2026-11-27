import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/images/app-icon-192.png", "assets/images/app-icon-512.png", "assets/images/apple-touch-icon.png"],
      manifest: {
        name: "小芽家庭学习岛",
        short_name: "小芽家庭",
        description: "家长管理的儿童自适应学习空间",
        lang: "zh-Hans",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "any",
        background_color: "#f7f1e2",
        theme_color: "#afdce2",
        icons: [
          { src: "assets/images/app-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "assets/images/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,json}"],
        navigateFallback: "index.html"
      }
    })
  ],
  build: {
    outDir: resolve(import.meta.dirname, "../../family"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("/src/content/audioAssets")) return "audio-assets";
          if (id.includes("/src/content/handwriting") || id.includes("/src/content/englishHandwriting") || id.includes("/src/content/speaking") || id.includes("/src/content/arcade")) {
            return "studio-content";
          }
          if (id.includes("/src/content/language") || id.includes("/src/content/farTransfer")) {
            return "curriculum-language";
          }
          if (id.includes("/src/content/")) return "curriculum-core";
          if (
            id.includes("/src/screens/HandwritingScreen") ||
            id.includes("/src/screens/SpeakingScreen") ||
            id.includes("/src/screens/ArcadeScreen") ||
            id.includes("/src/screens/MistakeNotebookScreen")
          ) {
            return "studios";
          }
          return undefined;
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true
  }
});
