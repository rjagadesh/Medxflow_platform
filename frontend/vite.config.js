import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The React dev server runs on :5173. API calls to /api are proxied to the
// Django backend on :8000 so the frontend can use same-origin relative URLs.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      // Uploaded media (avatars) served by Django.
      "/media": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
