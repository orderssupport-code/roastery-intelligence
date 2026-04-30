import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: change `base` to "/<your-repo-name>/" for GitHub Pages,
// or leave as "/" if you're deploying to Vercel/Netlify or a custom domain.
export default defineConfig({
  plugins: [react()],
  base: "/roastery-intelligence/",
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1500,
  },
});
