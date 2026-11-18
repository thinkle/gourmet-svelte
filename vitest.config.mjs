// Vitest for the rebuilt app's own tests (src/app, src/components).
// The kept logic's old Jest tests are ported separately (card R0-3); the REST
// contract tests stay on Jest (`npm run test:api`).
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.mjs";

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    resolve: { conditions: ["browser"] },
    test: {
      include: ["src/app/**/*.test.js", "src/components/**/*.test.js"],
      environment: "jsdom",
      setupFiles: ["./vitest.setup.js"],
    },
  })
);
