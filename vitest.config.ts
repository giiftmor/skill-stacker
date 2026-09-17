import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["vitest.setup.ts"],
    env: { NODE_ENV: "test" },
    exclude: ["node_modules", "e2e", "playwright.config.ts", ".worktrees"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
