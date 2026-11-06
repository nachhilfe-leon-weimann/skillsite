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
    expect(reports.map((report) => report.message)).toEqual([
      expect.stringContaining("A shared package imports nothing from an app."),
    ]);
  });
});

describe("booking module boundaries", { timeout: 60_000 }, () => {
  const DEEP = "Import modules/booking through its index.ts or server.ts";

  test.each([
    "@/modules/booking/server/actions",
    "@/modules/booking/components/booker",
  ])("a route importing %s fails lint", async (source) => {
    const reports = await lint(
      appRoot,
      "src/app/termin/page.tsx",
      `import * as booking from "${source}";\nexport const used = booking;\n`,
    );
    expect(reports.map((report) => report.message)).toEqual([
      expect.stringContaining(DEEP),
    ]);
  });

  test("a route may import @/modules/booking and @/modules/booking/server", async () => {
    const reports = await lint(
      appRoot,
      "src/app/termin/page.tsx",
      [
        'import { Booker } from "@/modules/booking";',
        'import { handleAvailabilityRequest } from "@/modules/booking/server";',
        "export const used = [Booker, handleAvailabilityRequest];",
        "",
      ].join("\n"),
    );
    expect(reports).toEqual([]);
  });

  test("another module importing booking's internals fails lint", async () => {
    const reports = await lint(
      appRoot,
      "src/modules/payment/x.ts",
      'import { bookingEvents } from "@/modules/booking/model/config";\nexport const events = bookingEvents;\n',
    );
    expect(reports.map((report) => report.message)).toEqual([
      expect.stringContaining(DEEP),
    ]);
  });
});

describe("client-safe module code", { timeout: 60_000 }, () => {
  const CLIENT_SAFE = "Client-safe code of modules/booking";

  test.each([
    ["index.ts", "@/modules/booking/server"],
    ["index.ts", "./server"],
    ["index.ts", "./server/log"],
    ["model/x.ts", "../server/log"],
    ["model/x.ts", "@/modules/booking/server"],
    ["components/x.tsx", "../server/log"],
    ["components/x.tsx", "@/modules/booking/server/log"],
    ["components/x.tsx", "@/modules/booking/server"],
    // The server-action exception holds for components/ only.
    ["index.ts", "./server/actions"],
    ["model/x.ts", "../server/actions"],
    // Another module's server entry is server code too.
    ["index.ts", "../payment/server"],
    ["model/x.ts", "@/modules/payment/server"],
    ["components/x.tsx", "@/modules/payment/server"],
  ])("modules/booking/%s importing %s fails lint", async (file, source) => {
    const reports = await lint(
      appRoot,
      `src/modules/booking/${file}`,
      `export * from "${source}";\n`,
    );
    expect(reports.map((report) => report.message)).toEqual([
      expect.stringContaining(CLIENT_SAFE),
    ]);
  });

  test("a component may import the module's server actions", async () => {
    const reports = await lint(
      appRoot,
      "src/modules/booking/components/x.tsx",
      'import { requestBooking } from "../server/actions";\nexport const action = requestBooking;\n',
    );
    expect(reports).toEqual([]);
  });

  test("server code may import the module's model", async () => {
    const reports = await lint(
      appRoot,
      "src/modules/booking/server/x.ts",
      'import { bookingEvents } from "../model/config";\nexport const events = bookingEvents;\n',
    );
    expect(reports).toEqual([]);
  });

  test("client-safe code may import another module's index.ts", async () => {
    const reports = await lint(
      appRoot,
      "src/modules/booking/components/x.tsx",
      'import { buildPaypalUrl } from "@/modules/payment";\nexport const url = buildPaypalUrl;\n',
    );
    expect(reports).toEqual([]);
  });

  test("server code may import another module's server.ts", async () => {
    const reports = await lint(
      appRoot,
      "src/modules/booking/server/x.ts",
      'import { logPayment } from "@/modules/payment/server";\nexport const log = logPayment;\n',
    );
    expect(reports).toEqual([]);
  });
});

/**
 * Whether `source` holds a string literal naming a module's server code -
 * `./server`, `../<name>/server`, `@/modules/<name>/server` or a file below
 * any of them - as an import, a re-export or a dynamic import.
 */
const namesServerCode = (source: string) =>
  /["'](?:\.\/|\.\.\/[^/"']+\/|@\/modules\/[^/"']+\/)server(?:\.ts)?(?:\/[^"']*)?["']/.test(
    source,
  );

test.each([
  ['export * from "./server";', true],
  ["export { logBooking } from './server/log';", true],
  ['import "./server.ts";', true],
  [
    'export { handleAvailabilityRequest } from "@/modules/booking/server";',
    true,
  ],
  ['await import("@/modules/booking/server/log");', true],
  ['export { Booker } from "./components/booker";', false],
  ['export { bookingToday } from "./model/dates";', false],
  ['export * from "@/modules/payment/server";', true],
  ['export * from "@/modules/payment";', false],
  ['export * from "../payment/server";', true],
  ['export { logPayment } from "../payment/server/log";', true],
  ['export * from "../payment";', false],
])("the index.ts scan flags %s: %s", (source, flagged) => {
  expect(namesServerCode(source)).toBe(flagged);
});

test("no module's client-safe index.ts names server code", () => {
  expect(moduleNames.length).toBeGreaterThan(0);
  for (const name of moduleNames) {
    const index = path.join(modulesDir, name, "index.ts");
    expect(existsSync(index), `modules/${name}/index.ts`).toBe(true);
    expect(
      namesServerCode(readFileSync(index, "utf8")),
      `modules/${name}/index.ts`,
    ).toBe(false);
  }
});

test('every module\'s server/actions.ts is a "use server" module', () => {
  // The client-safe zones let components/ import server/actions.ts because
  // Next.js bundles only a reference to a "use server" module. Without the
  // directive, that import would ship the server code to the client.
  const actions = moduleNames
    .map((name) => path.join(modulesDir, name, "server/actions.ts"))
    .filter((file) => existsSync(file));
  expect(actions.length).toBeGreaterThan(0);
  for (const file of actions) {
    expect(
      readFileSync(file, "utf8").startsWith('"use server";\n'),
      path.relative(modulesDir, file),
    ).toBe(true);
  }
});
