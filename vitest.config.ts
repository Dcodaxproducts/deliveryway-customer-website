import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000/api/v1",
    },
    passWithNoTests: true,
  },
});
