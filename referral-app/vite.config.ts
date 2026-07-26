import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths so the built app can be served from any subpath
  // (it's embedded in the MedXFlow app at /referral/).
  base: "./",
  plugins: [react()],
  server: { port: 5200 },
});
