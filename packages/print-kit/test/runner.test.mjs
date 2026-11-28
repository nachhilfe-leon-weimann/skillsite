/**
 * The runner runs only the pinned Typst: it checks a tarball's SHA-256 against toolchain.json before it extracts
 * anything, on a cached tarball and on a fresh download alike, and a Typst on the PATH is never used. The hash
 * checks run on a temporary pin and cache; a stub `fetch` stands in for the download. Runners started at the same
 * time on an empty cache all run the binary.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { Readable } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";

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

/**
 * A temporary cache and a pin that expects `pinned` for this platform's tarball. The cache holds `bytes` as that
 * tarball, or, with `cached: false`, nothing, so the runner downloads it.
 */
function fixture(name, bytes, pinned, { cached = true } = {}) {
  const dir = path.join(scratch, name);
  const pin = readToolchain(defaults.toolchain);
  const target = targetTriple();
  const versionDir = path.join(dir, "cache", `typst-${pin.version}`);
  const tarball = path.join(versionDir, `typst-${target}.tar.xz`);
  mkdirSync(versionDir, { recursive: true });
  if (cached) writeFileSync(tarball, bytes);
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
    versionDir,
    tarball,
    binary: path.join(versionDir, target, "typst"),
  };
}

/** A `fetch` that answers every request with `bytes`, as if served from `url`. */
const serving =
  (bytes, url = "https://example.test/typst.tar.xz") =>
  async () => ({
    ok: true,
    status: 200,
    url,
    body: Readable.toWeb(Readable.from([bytes])),
  });

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

test("the runner refuses a download whose SHA-256 differs from the pin, and caches nothing", async () => {
  const bytes = Buffer.from("not the pinned Typst release");
  const wrongPin = sha256(Buffer.from("another file"));
  const { toolchain, cacheDir, versionDir, tarball, binary } = fixture(
    "download-wrong-pin",
    bytes,
    wrongPin,
    { cached: false },
  );

  await assert.rejects(
    ensureTypst({ toolchain, cacheDir, fetch: serving(bytes) }),
    (error) => {
      assert.ok(error instanceof RunnerError);
      assert.match(error.message, /SHA-256 mismatch/);
      assert.match(error.message, /nothing was cached/);
      assert.match(error.message, new RegExp(`actual  ${sha256(bytes)}`));
      return true;
    },
  );
  assert.equal(existsSync(tarball), false);
  assert.deepEqual(
    readdirSync(versionDir).filter((file) => file.endsWith(".part")),
    [],
  );
  assert.equal(existsSync(binary), false);
});

test("a download that matches the pin is cached and reaches extraction", async () => {
  // The control for the test above: the same bytes, pinned correctly, are kept and fail only later, in tar.
  const bytes = Buffer.from("not the pinned Typst release");
  const { toolchain, cacheDir, tarball, binary } = fixture(
    "download-right-pin",
    bytes,
    sha256(bytes),
    { cached: false },
  );

  await assert.rejects(
    ensureTypst({ toolchain, cacheDir, fetch: serving(bytes) }),
    /tar could not extract/,
  );
  assert.ok(readFileSync(tarball).equals(bytes));
  assert.equal(existsSync(binary), false);
});

test("the runner refuses a download that was redirected away from https", async () => {
  const bytes = Buffer.from("not the pinned Typst release");
  const { toolchain, cacheDir, tarball } = fixture(
    "download-http",
    bytes,
    sha256(bytes),
    { cached: false },
  );

  await assert.rejects(
    ensureTypst({
      toolchain,
      cacheDir,
      fetch: serving(bytes, "http://example.test/typst.tar.xz"),
    }),
    /not https/,
  );
  assert.equal(existsSync(tarball), false);
});

test("runners started at the same time on an empty cache all run the binary", async () => {
  // A stub release: a typst script that prints "stub", and many small files, so that removing an install takes
  // long enough for a second runner to trip over it.
  const target = targetTriple();
  const release = path.join(scratch, "stub-release");
  const stubDir = path.join(release, `typst-${target}`);
  mkdirSync(path.join(stubDir, "padding"), { recursive: true });
  writeFileSync(path.join(stubDir, "typst"), "#!/bin/sh\necho stub\n");
  chmodSync(path.join(stubDir, "typst"), 0o755);
  for (let i = 0; i < 500; i++) {
    writeFileSync(path.join(stubDir, "padding", `${i}.txt`), `${i}\n`);
  }
  const archive = path.join(scratch, "stub.tar.xz");
  const tar = spawnSync("tar", [
    "-cJf",
    archive,
    "-C",
    release,
    `typst-${target}`,
  ]);
  assert.equal(tar.status, 0, String(tar.stderr));
  const bytes = readFileSync(archive);
  const { toolchain, cacheDir, binary } = fixture(
    "concurrent",
    bytes,
    sha256(bytes),
  );

  // Each runner is its own process, as the test files and build steps are: it ensures the binary and runs it.
  const runner = pathToFileURL(path.join(kitDir, "bin", "typst.mjs")).href;
  const script = `
    import { spawnSync } from "node:child_process";
    import { ensureTypst } from ${JSON.stringify(runner)};
    const binary = await ensureTypst(${JSON.stringify({ toolchain, cacheDir })});
    const result = spawnSync(binary, { encoding: "utf8" });
    if (result.status !== 0 || result.stdout !== "stub\\n") {
      console.error(result.error?.message ?? result.signal ?? result.stderr);
      process.exitCode = 1;
    }`;
  const run = () =>
    new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        ["--input-type=module", "-e", script],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      let stderr = "";
      child.stderr.on("data", (chunk) => (stderr += chunk));
      child.on("close", (code, signal) => resolve({ code, signal, stderr }));
    });

  for (let round = 0; round < 3; round++) {
    rmSync(path.dirname(binary), { recursive: true, force: true });
    const results = await Promise.all(Array.from({ length: 8 }, run));
    for (const result of results) {
      assert.deepEqual(result, { code: 0, signal: null, stderr: "" });
    }
    assert.equal(
      readFileSync(path.join(path.dirname(binary), "tarball.sha256"), "utf8"),
      `${sha256(bytes)}\n`,
    );
  }
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
