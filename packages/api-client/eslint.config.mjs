import { defineConfig, globalIgnores } from "eslint/config";

import { packageBoundaries } from "@skillsite/config/eslint/boundaries.mjs";
import config from "@skillsite/config/eslint/next.mjs";

export default defineConfig([
  ...config,
  {
    // A plain TypeScript package: no React to detect, no pages directory to link into.
    settings: { react: { version: "19" } },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  packageBoundaries(import.meta.dirname),
  // Generated from the contract by `generate`, never edited by hand.
  globalIgnores(["src/schema.ts"]),
]);
