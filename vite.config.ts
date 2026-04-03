import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase warning threshold (our chunks are intentionally split)
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Split vendor libraries into separate cached chunks.
        // Users download these ONCE and the browser caches them.
        // Only your app code re-downloads on updates.
        manualChunks: {
          // React core — almost never changes
          "vendor-react": ["react", "react-dom"],

          // React Router — stable
          "vendor-router": ["react-router-dom"],

          // Clerk auth — only loads once
          "vendor-clerk": ["@clerk/clerk-react"],

          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],

          // TanStack Query (data fetching)
          "vendor-query": ["@tanstack/react-query"],

          // Radix UI + shadcn components (all grouped — large but stable)
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-accordion",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
          ],

          // Lucide icons
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
}));
