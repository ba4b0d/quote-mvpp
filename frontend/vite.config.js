import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isStaff = mode === "staff";

  return {
    base: isStaff ? "/staff/" : "/",
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: isStaff ? "3DJAT Quote (Staff)" : "3DJAT Quote",
          short_name: isStaff ? "3DJAT Staff" : "3DJAT Quote",
          description: isStaff
            ? "نسخه داخلی محاسبه‌گر قیمت چاپ سه‌بعدی 3DJAT"
            : "محاسبه‌گر قیمت چاپ سه‌بعدی 3DJAT",
          // مهم: برای staff باید زیر /staff/ نصب شود
          start_url: isStaff ? "/staff/" : "/",
          scope: isStaff ? "/staff/" : "/",
          display: "standalone",
          background_color: "#f5f3f4",
          theme_color: "#4f7d63",
          dir: "rtl",
          lang: "fa",
          icons: [
            { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          ],
        },
      }),
    ],
    build: {
      outDir: isStaff ? "dist-staff" : "dist",
      emptyOutDir: true,
    },
  };
});
