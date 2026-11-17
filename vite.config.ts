import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  build: {
    target: "es2018",
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          commerce: ["@tanstack/react-query", "@supabase/supabase-js", "zustand"],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },

  plugins: [
    react(),
    {
      name: "genan-defer-app-styles",
      apply: "build",
      transformIndexHtml: {
        order: "post",
        handler: (html) => html.replace(
          /(<link rel="stylesheet"[^>]+href="\/assets\/index-[\w-]+\.css")>/,
          "$1 data-genan-app-styles media=\"print\" onload=\"this.media='all'\" onerror=\"this.media='all'\">",
        ),
      },
    },
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-zoom-pan-pinch": path.resolve(__dirname, "./src/lib/instantZoomCompat.tsx"),
    },
  },
}));
