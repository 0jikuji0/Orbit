import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Variables locales (DATABASE_URL…) ; en CI elles viennent de l'environnement.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
