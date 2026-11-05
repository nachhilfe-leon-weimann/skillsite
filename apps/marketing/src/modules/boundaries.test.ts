import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { ESLint } from "eslint";
import { describe, expect, test } from "vitest";

// The module rules of the foundation spec (_Target shape_), as the real lint
// configs enforce them: `import/no-restricted-paths` zones from
// `@skillsite/config/eslint/boundaries.mjs`.

const appRoot = path.resolve(import.meta.dirname, "../..");
const uiRoot = path.resolve(appRoot, "../../packages/ui");
const modulesDir = path.join(appRoot, "src/modules");
const RULE = "import/no-restricted-paths";

const moduleNames = readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/** Lints `code` as if it were the file at `file` (relative to `root`). */
async function lint(root: string, file: string, code: string) {
  const eslint = new ESLint({ cwd: root });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(root, file),
  });
  if (!result) throw new Error(`ESLint returned no result for ${file}`);
  // A parse error would let every "reports nothing" case pass for the wrong
  // reason (a missing plugin or an invalid rule config throws instead).
  expect(result.messages.filter((message) => message.fatal)).toEqual([]);
  return result.messages.filter((message) => message.ruleId === RULE);
}

describe("module boundaries", { timeout: 60_000 }, () => {
  test("a route importing a module's internals fails lint", async () => {
    const reports = await lint(
      appRoot,
      "src/app/zahlung/page.tsx",
      'import { logPayment } from "@/modules/payment/server/log";\nexport const log = logPayment;\n',
    );
    expect(reports.map((report) => report.message)).toEqual([
      expect.stringContaining(
        "Import modules/payment through its index.ts or server.ts",
      ),
    ]);
  });

  test("a route may import a module's index.ts and server.ts", async () => {
    const reports = await lint(
      appRoot,
      "src/app/zahlung/page.tsx",
      [
        'import { parsePaymentRequest } from "@/modules/payment";',
        'import { logPayment } from "@/modules/payment/server";',
        "export const used = [parsePaymentRequest, logPayment];",
        "",
      ].join("\n"),
    );
    expect(reports).toEqual([]);
  });

  test("a module may import its own internals", async () => {
    const reports = await lint(
      appRoot,
      "src/modules/payment/x.ts",
      'import { logPayment } from "./server/log";\nexport const log = logPayment;\n',
    );
    expect(reports).toEqual([]);
  });

  test("packages/ui importing from an app fails lint", async () => {
    const reports = await lint(
      uiRoot,
      "src/x.tsx",
      'import { routes } from "../../../apps/marketing/src/lib/routes";\nexport const home = routes;\n',
    );
    expect(reports).toHaveLength(1);
  });
});

test("no module's client-safe index.ts reaches its server code", () => {
  expect(moduleNames.length).toBeGreaterThan(0);
  for (const name of moduleNames) {
    const index = path.join(modulesDir, name, "index.ts");
    expect(existsSync(index), `modules/${name}/index.ts`).toBe(true);
    // Any string literal naming ./server or a file below it: import, re-export
    // or dynamic import.
    expect(readFileSync(index, "utf8")).not.toMatch(
      /["']\.\/server(?:\.ts)?(?:\/[^"']*)?["']/,
    );
  }
});
