import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: process.env.VITE_BROWSER_PROVIDER ?? "preview",
      instances: [{ browser: "firefox" }],
    },
  },
});
