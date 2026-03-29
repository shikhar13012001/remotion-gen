import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@yt-shorts/core":           path.resolve(__dirname, "../core/src/index.ts"),
      "@yt-shorts/video-renderer": path.resolve(__dirname, "../video-renderer/src/index.ts"),
    },
  },
});
