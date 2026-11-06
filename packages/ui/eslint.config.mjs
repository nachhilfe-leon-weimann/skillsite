import { defineConfig } from "eslint/config";

import { packageBoundaries } from "@skillsite/config/eslint/boundaries.mjs";
import config from "@skillsite/config/eslint/next.mjs";

export default defineConfig([
  ...config,
  {
    rules: {
      // Library package: there is no app router/pages directory to link into.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  packageBoundaries(import.meta.dirname),
]);
