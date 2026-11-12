import { readFile } from "node:fs/promises";

import { expect, test } from "vitest";

import {
  CONTRACT_PATH,
  generateSchema,
  SCHEMA_PATH,
} from "../scripts/codegen.ts";

test("src/schema.ts matches the vendored contract (else run `pnpm --filter @skillsite/api-client generate`)", async () => {
  const contract = await readFile(CONTRACT_PATH, "utf8");
  const schema = await readFile(SCHEMA_PATH, "utf8");

  expect(schema).toBe(await generateSchema(contract));
});
