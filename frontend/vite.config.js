import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "3DJAT Quote",
        short_name: "3DJAT Quote",
        description: "محاسبه‌گر قیمت چاپ سه‌بعدی 3DJAT",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#f5f3f4",
        theme_color: "#4f7d63",
        dir: "rtl",
        lang: "fa",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    }),
  ],
});
