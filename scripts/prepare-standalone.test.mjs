import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, test } from "vitest";

import { prepareStandalone, standaloneLayout } from "./prepare-standalone.mjs";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const marketing = path.join(repoRoot, "apps", "marketing");

let sandbox;
afterEach(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true });
  sandbox = undefined;
});

/** A fake repo with one built app: `<root>/apps/site` and its standalone bundle. */
function fakeBuild() {
  sandbox = mkdtempSync(path.join(tmpdir(), "prepare-standalone-"));
  const appDir = path.join(sandbox, "apps", "site");
  const put = (file, content) => {
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true });
    writeFileSync(path.join(appDir, file), content);
  };
  put(".next/standalone/apps/site/server.js", "// server");
  // Next traces files the server reads from public/ into the bundle already; the copy adds the rest.
  put(".next/standalone/apps/site/public/traced.txt", "traced");
  put(".next/static/chunks/main.js", "chunk");
  put("public/images/photo.webp", "photo");
  return { root: sandbox, appDir };
}

test("copies .next/static and public/ next to the server entry", () => {
  const { root, appDir } = fakeBuild();
  const { server } = prepareStandalone(appDir, root);
  const app = path.join(appDir, ".next", "standalone", "apps", "site");
  expect(server).toBe(path.join(app, "server.js"));
  const read = (file) => readFileSync(path.join(app, file), "utf8");
  expect(read(".next/static/chunks/main.js")).toBe("chunk");
  expect(read("public/images/photo.webp")).toBe("photo");
  expect(read("public/traced.txt")).toBe("traced");
});

test("runs again over a prepared bundle", () => {
  const { root, appDir } = fakeBuild();
  prepareStandalone(appDir, root);
  expect(() => prepareStandalone(appDir, root)).not.toThrow();
});

test("fails with a hint when the app is not built", () => {
  const { root, appDir } = fakeBuild();
  rmSync(path.join(appDir, ".next"), { recursive: true });
  expect(() => prepareStandalone(appDir, root)).toThrow(/build/);
});

test("copies what the Dockerfile's runner stage copies", () => {
  // `COPY --from=build [--chown=…] /app/apps/${APP}/<from> ./<to>`; the bundle itself lands in `./`.
  const copies = [
    ...readFileSync(path.join(repoRoot, "Dockerfile"), "utf8").matchAll(
      /^COPY --from=build (?:--\S+ )*\/app\/(\S+) \.\/(\S*)$/gm,
    ),
  ]
    .map(([, from, to]) => ({
      from: from.replaceAll("${APP}", "marketing"),
      to: to.replaceAll("${APP}", "marketing"),
    }))
    .filter(({ from }) => !from.endsWith(".next/standalone"));
  expect(copies.length).toBeGreaterThan(0);

  const layout = standaloneLayout(marketing, repoRoot);
  const bundle = path.join(marketing, ".next", "standalone");
  expect(
    layout.copies.map(({ from, to }) => ({
      from: path.relative(repoRoot, from),
      to: path.relative(bundle, to),
    })),
  ).toEqual(copies);
});

test("the smoke suite starts the server entry it prepares", () => {
  const config = readFileSync(
    path.join(marketing, "playwright.config.ts"),
    "utf8",
  );
  const { server } = standaloneLayout(marketing, repoRoot);
  expect(config).toContain(`node ${path.relative(marketing, server)}`);
  expect(config).toContain("prepare-standalone.mjs");
});
