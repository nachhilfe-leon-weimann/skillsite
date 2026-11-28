/**
 * The runner runs only the pinned Typst: it checks a tarball's SHA-256 against toolchain.json before it extracts
 * anything, and a Typst on the PATH is never used. The hash checks run on a temporary pin and cache, with no
 * download.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  defaults,
  ensureTypst,
  readToolchain,
  RunnerError,
  targetTriple,
} from "../bin/typst.mjs";

const kitDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const scratch = mkdtempSync(path.join(os.tmpdir(), "print-kit-runner-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("toolchain.json pins Typst 0.15.1 from its GitHub release, with a SHA-256 per supported target", () => {
  const pin = readToolchain(defaults.toolchain);

  assert.equal(pin.version, "0.15.1");
  assert.equal(
    pin.url,
    "https://github.com/typst/typst/releases/download/v{version}/typst-{target}.tar.xz",
  );
  assert.deepEqual(Object.keys(pin.sha256).sort(), [
    "aarch64-apple-darwin",
    "aarch64-unknown-linux-musl",
    "x86_64-apple-darwin",
    "x86_64-unknown-linux-musl",
  ]);
  for (const [platform, arch] of [
    ["darwin", "arm64"],
    ["darwin", "x64"],
    ["linux", "arm64"],
    ["linux", "x64"],
  ]) {
    assert.ok(pin.sha256[targetTriple(platform, arch)], `${platform}-${arch}`);
  }
  assert.throws(
    () => targetTriple("win32", "x64"),
    /no Typst build is pinned for win32-x64/,
  );
});

/** A temporary cache holding `bytes` as this platform's tarball, and a pin that expects `pinned` for it. */
function fixture(name, bytes, pinned) {
  const dir = path.join(scratch, name);
  const pin = readToolchain(defaults.toolchain);
  const target = targetTriple();
  const versionDir = path.join(dir, "cache", `typst-${pin.version}`);
  mkdirSync(versionDir, { recursive: true });
  writeFileSync(path.join(versionDir, `typst-${target}.tar.xz`), bytes);
  const toolchain = path.join(dir, "toolchain.json");
  writeFileSync(
    toolchain,
    JSON.stringify({
      typst: { ...pin, sha256: { ...pin.sha256, [target]: pinned } },
    }),
  );
  return {
    toolchain,
    cacheDir: path.join(dir, "cache"),
    binary: path.join(versionDir, target, "typst"),
  };
}

test("the runner refuses a tarball whose SHA-256 differs from the pin, before extracting it", async () => {
  const bytes = Buffer.from("not the pinned Typst release");
  const wrongPin = sha256(Buffer.from("another file"));
  const { toolchain, cacheDir, binary } = fixture("wrong-pin", bytes, wrongPin);

  await assert.rejects(ensureTypst({ toolchain, cacheDir }), (error) => {
    assert.ok(error instanceof RunnerError);
    assert.match(error.message, /SHA-256 mismatch/);
    assert.match(error.message, new RegExp(`pinned  ${wrongPin}`));
    assert.match(error.message, new RegExp(`actual  ${sha256(bytes)}`));
    return true;
  });
  assert.equal(existsSync(binary), false);
});

test("a tarball that matches the pin passes the check and reaches extraction", async () => {
  // The control for the test above: the same bytes, pinned correctly, fail only later, in tar.
  const bytes = Buffer.from("not the pinned Typst release");
  const { toolchain, cacheDir, binary } = fixture(
    "right-pin",
    bytes,
    sha256(bytes),
  );

  await assert.rejects(
    ensureTypst({ toolchain, cacheDir }),
    /tar could not extract/,
  );
  assert.equal(existsSync(binary), false);
});

test("the runner ignores a typst on the PATH", () => {
  const fakeBin = path.join(scratch, "fake-bin");
  const marker = path.join(scratch, "fake-typst-ran");
  mkdirSync(fakeBin, { recursive: true });
  writeFileSync(
    path.join(fakeBin, "typst"),
    `#!/bin/sh\ntouch "${marker}"\necho "typst 0.0.0 (fake)"\n`,
  );
  chmodSync(path.join(fakeBin, "typst"), 0o755);

  const result = spawnSync(
    process.execPath,
    [path.join(kitDir, "bin", "typst.mjs"), "--version"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
      },
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^typst 0\.15\.1 \(/);
  assert.equal(existsSync(marker), false);
});
