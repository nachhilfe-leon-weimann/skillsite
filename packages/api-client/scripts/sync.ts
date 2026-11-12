/**
 * `pnpm --filter @skillsite/api-client sync [checkout]`: copies SkillForge's committed `openapi.json` into
 * `contracts/` byte for byte, then regenerates `src/schema.ts`. The checkout defaults to `../skillforge` beside this
 * repository; a relative argument resolves from the directory the command was started in.
 */
import { copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CONTRACT_PATH, writeSchema } from "./codegen.ts";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
// pnpm runs the script inside the package; INIT_CWD is where the command was started.
const startDir = process.env.INIT_CWD ?? process.cwd();
const [argument] = process.argv.slice(2);
const checkout = argument
  ? path.resolve(startDir, argument)
  : path.resolve(repoRoot, "../skillforge");
const source = path.join(checkout, "openapi.json");

let version: string;
try {
  const contract = JSON.parse(await readFile(source, "utf8")) as {
    info?: { version?: string };
  };
  version = contract.info?.version ?? "unknown";
} catch (error) {
  console.error(
    `[api-client] no readable contract at ${source}: pass the SkillForge checkout as an argument`,
  );
  throw error;
}

await copyFile(source, CONTRACT_PATH);
await writeSchema();
console.log(
  `[api-client] synced contracts/openapi.json from ${source} (SkillForge ${version}) and regenerated src/schema.ts`,
);
