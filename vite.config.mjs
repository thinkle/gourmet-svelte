import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  // Constants the kept logic expects from the build.
  define: {
    DEV: JSON.stringify(mode !== "production"),
    BUILD_MS: JSON.stringify(String(Date.now())),
    BUILD_TIME: JSON.stringify(new Date().toString()),
    global: "globalThis",
  },
  build: { outDir: "dist", sourcemap: true },
  server: { port: 5173, strictPort: false },
}));
