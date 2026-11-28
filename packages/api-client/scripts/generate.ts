/** `pnpm --filter @skillsite/api-client generate`: regenerates `src/schema.ts` from the vendored contract. */
import { writeSchema } from "./codegen.ts";

await writeSchema();
console.log(
  "[api-client] src/schema.ts regenerated from contracts/openapi.json",
);
