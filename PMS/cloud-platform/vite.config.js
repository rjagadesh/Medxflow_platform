import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Proxy API + media to the local Django backend so the publicly-served
  // frontend can reach the local-only backend (127.0.0.1:8002) same-origin.
  const backend = "http://127.0.0.1:8002";
  return {
    plugins: [react(), tailwindcss(), tsconfigPaths(), svgr()],
    server: {
      port: 5201,
      proxy: {
        "/app": { target: backend, changeOrigin: true },
        "/media": { target: backend, changeOrigin: true },
        "/ws": { target: backend, ws: true, changeOrigin: true },
      },
    },
    resolve: {
      alias: {
        // eslint-disable-next-line no-undef
        "@": path.resolve(__dirname, "./src"),
      },
    },
    esbuild: {
      drop: mode === "development" ? [] : ["console", "debugger"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              "react",
              "react-dom",
              "react-dom/client",
              "react-router-dom",
            ],
            "react-apexcharts": ["react-apexcharts"],
            "chakra-ui": ["@chakra-ui/react"],
          },
        },
      },
    },
  };
});
