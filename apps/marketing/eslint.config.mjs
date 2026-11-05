import { defineConfig } from "eslint/config";

import { moduleBoundaries } from "@skillsite/config/eslint/boundaries.mjs";
import config from "@skillsite/config/eslint/next.mjs";

export default defineConfig([...config, moduleBoundaries(import.meta.dirname)]);
