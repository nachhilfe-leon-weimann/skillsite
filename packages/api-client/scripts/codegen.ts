/**
 * Generates `src/schema.ts` from the vendored contract `contracts/openapi.json` with openapi-typescript.
 * The scripts `generate` and `sync` write it; `src/schema.test.ts` regenerates it in memory and compares.
 *
 * openapi-typescript is a dev dependency of the workspace root, not of this package: it builds its output with the
 * TypeScript compiler API (peer `typescript@5`), which TypeScript 7 no longer ships, and pnpm would resolve that
 * peer to this package's TypeScript 7.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import openapiTS, { astToString } from "openapi-typescript";

export const CONTRACT_PATH = fileURLToPath(
  new URL("../contracts/openapi.json", import.meta.url),
);
export const SCHEMA_PATH = fileURLToPath(
  new URL("../src/schema.ts", import.meta.url),
);

const HEADER = `/**
 * Generated from contracts/openapi.json by openapi-typescript - never edit by hand.
 * Regenerate with \`pnpm --filter @skillsite/api-client generate\`; take a new contract with \`sync\`.
 */

`;

/** The TypeScript types of a contract, given as its JSON text. */
export async function generateSchema(contract: string): Promise<string> {
  return HEADER + astToString(await openapiTS(contract));
}

/** Regenerates `src/schema.ts` from the vendored contract. */
export async function writeSchema(): Promise<void> {
  const contract = await readFile(CONTRACT_PATH, "utf8");
  await writeFile(SCHEMA_PATH, await generateSchema(contract));
}
