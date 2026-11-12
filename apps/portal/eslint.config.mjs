import { defineConfig } from "eslint/config";

import { moduleBoundaries } from "@skillsite/config/eslint/boundaries.mjs";
import config from "@skillsite/config/eslint/next.mjs";

export default defineConfig([
  ...config,
  moduleBoundaries(import.meta.dirname),
  {
    // The environment is read in one place: `lib/env.ts` parses and types it,
    // `instrumentation.ts` checks it at server start. `next.config.ts` and the
    // Playwright config sit outside `src/` on purpose: they run in plain Node,
    // where `lib/env.ts`'s `server-only` import throws, and read tooling
    // variables, not the app's runtime environment.
    name: "skillsite/env-access",
    files: ["src/**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    ignores: [
      "src/lib/env.ts",
      "src/instrumentation.ts",
      "src/**/*.test.{ts,tsx,mts}",
    ],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Read the environment through `@/lib/env`.",
        },
      ],
    },
  },
]);
