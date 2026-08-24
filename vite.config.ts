import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mcpPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      // Registo é feito manualmente em src/main.tsx (evita duplicação)
      injectRegister: null,
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "images/*.png", "icons/*.png"],
      manifest: {
        id: "/",
        name: "SIGE+ — Sistema Integrado de Gestão da Educação",
        short_name: "SIGE+",
        description: "Sistema Integrado de Gestão da Educação — Município de Namacunde",
        lang: "pt-PT",
        dir: "ltr",
        theme_color: "#1e3a8a",
        background_color: "#0b1a3a",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        categories: ["education", "government", "productivity"],
        icons: [
          { src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
        shortcuts: [
          { name: "Quadro de Pessoal", short_name: "Agentes", url: "/professores" },
          { name: "Gerador INSS", short_name: "INSS", url: "/inss" },
          { name: "Expedientes", short_name: "Expedientes", url: "/expedientes" },
        ],
        screenshots: [
          { src: "/icons/screenshot-desktop.png", sizes: "1280x800", type: "image/png", form_factor: "wide" },
          { src: "/icons/screenshot-mobile.png", sizes: "720x1280", type: "image/png", form_factor: "narrow" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        // Bibliotecas pesadas (exceljs, xlsx, jspdf, html2canvas, recharts) ficam
        // fora do precache — são carregadas lazy e depois cacheadas em runtime
        // pela estratégia CacheFirst de "assets".
        globIgnores: ["**/vendor-{sheets,pdf,charts}-*.js"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            urlPattern: ({ request }) =>
              ["style", "script", "worker", "image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "assets",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-auth",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (/exceljs|[\\/]xlsx[\\/]/.test(id)) return "vendor-sheets";
          if (/jspdf|html2canvas/.test(id)) return "vendor-pdf";
          if (/recharts|d3-/.test(id)) return "vendor-charts";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
