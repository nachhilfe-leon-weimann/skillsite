#!/usr/bin/env node
/**
 * The print kit's Typst runner: `node bin/typst.mjs <typst arguments>`.
 *
 * Runs the Typst CLI pinned in `toolchain.json` and never a Typst on the PATH. On first use it downloads the
 * release tarball for this platform over https into `.cache/` (gitignored), checks its SHA-256 against the pin
 * before extracting it, and keeps the tarball and the binary for later runs. A pin that no longer matches the
 * cached tarball stops the runner. Dependency-free: Node and `tar` (with xz support) only.
 *
 * As a module it exports `ensureTypst()`, which returns the verified binary's path, so tests can point it at
 * another pin or cache.
 */
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  readFileSync,
} from "node:fs";
import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const kitDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The pin and the cache the command line uses. */
export const defaults = {
  toolchain: path.join(kitDir, "toolchain.json"),
  cacheDir: path.join(kitDir, ".cache"),
};

/** Node's platform and architecture, mapped to the target triple of Typst's release assets. */
const TARGETS = {
  "darwin-arm64": "aarch64-apple-darwin",
  "darwin-x64": "x86_64-apple-darwin",
  "linux-arm64": "aarch64-unknown-linux-musl",
  "linux-x64": "x86_64-unknown-linux-musl",
};

/** An error the runner explains itself: the command line prints its message without a stack. */
export class RunnerError extends Error {
  name = "RunnerError";
}

/** The target triple of this (or the given) platform. */
export function targetTriple(platform = process.platform, arch = process.arch) {
  const target = TARGETS[`${platform}-${arch}`];
  if (!target) {
    throw new RunnerError(
      `print-kit: no Typst build is pinned for ${platform}-${arch}. ` +
        `The runner supports ${Object.keys(TARGETS).join(", ")}.`,
    );
  }
  return target;
}

/** Reads and checks the pin: a version, an https URL template and a SHA-256 per target. */
export function readToolchain(file) {
  let pin;
  try {
    pin = JSON.parse(readFileSync(file, "utf8")).typst;
  } catch (error) {
    throw new RunnerError(
      `print-kit: cannot read the Typst pin ${file}: ${error.message}`,
    );
  }
  const rules = [
    [
      /^\d+\.\d+\.\d+$/.test(pin?.version),
      "`typst.version` is not a version such as 0.15.1",
    ],
    [
      String(pin?.url).startsWith("https://"),
      "`typst.url` is not an https URL",
    ],
    [
      String(pin?.url).includes("{target}"),
      "`typst.url` has no {target} placeholder",
    ],
    [
      Object.values(pin?.sha256 ?? {}).every((hash) =>
        /^[0-9a-f]{64}$/.test(hash),
      ),
      "a `typst.sha256` value is not 64 lowercase hex digits",
    ],
  ];
  const broken = rules.find(([holds]) => !holds);
  if (broken) throw new RunnerError(`print-kit: ${file}: ${broken[1]}.`);
  return pin;
}

/**
 * Returns the path of the pinned, verified Typst binary, downloading and extracting it first when the cache
 * does not hold it yet.
 */
export async function ensureTypst({
  toolchain = defaults.toolchain,
  cacheDir = defaults.cacheDir,
  platform = process.platform,
  arch = process.arch,
} = {}) {
  const pin = readToolchain(toolchain);
  const target = targetTriple(platform, arch);
  const expected = pin.sha256?.[target];
  if (!expected)
    throw new RunnerError(
      `print-kit: ${toolchain} pins no SHA-256 for ${target}.`,
    );

  const versionDir = path.join(cacheDir, `typst-${pin.version}`);
  const installDir = path.join(versionDir, target);
  const binary = path.join(installDir, "typst");
  if (existsSync(binary) && (await readStamp(installDir)) === expected)
    return binary;

  await mkdir(versionDir, { recursive: true });
  const tarball = path.join(versionDir, `typst-${target}.tar.xz`);
  if (existsSync(tarball)) {
    const actual = await sha256(tarball);
    if (actual !== expected) {
      throw mismatch(
        tarball,
        expected,
        actual,
        `If the pin is right, delete ${versionDir} and run again.`,
      );
    }
  } else {
    const url = pin.url
      .replaceAll("{version}", pin.version)
      .replaceAll("{target}", target);
    await download(url, tarball, expected);
  }
  await extract(tarball, target, installDir, expected);
  return binary;
}

/** The tarball hash an extracted binary came from; written last, so a half-extracted binary is never used. */
const STAMP = "tarball.sha256";

async function readStamp(installDir) {
  try {
    return (await readFile(path.join(installDir, STAMP), "utf8")).trim();
  } catch {
    return undefined;
  }
}

async function sha256(file) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(file), hash);
  return hash.digest("hex");
}

function mismatch(file, expected, actual, advice) {
  return new RunnerError(
    [
      `print-kit: SHA-256 mismatch for ${file}`,
      `  pinned  ${expected} (toolchain.json)`,
      `  actual  ${actual}`,
      `The runner never runs an unverified Typst. ${advice}`,
    ].join("\n"),
  );
}

/** Downloads `url` to a temporary file and moves it to `file` only when its SHA-256 equals `expected`. */
async function download(url, file, expected) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new RunnerError(
      `print-kit: cannot download Typst from ${url}: ${error.cause?.message ?? error.message}`,
    );
  }
  if (!response.ok || !response.body) {
    throw new RunnerError(
      `print-kit: downloading ${url} failed with HTTP ${response.status}.`,
    );
  }
  if (!response.url.startsWith("https://")) {
    throw new RunnerError(
      `print-kit: ${url} redirected to ${response.url}, which is not https.`,
    );
  }

  const partial = `${file}.${randomUUID()}.part`;
  const hash = createHash("sha256");
  try {
    await pipeline(
      Readable.fromWeb(response.body),
      async function* (chunks) {
        for await (const chunk of chunks) {
          hash.update(chunk);
          yield chunk;
        }
      },
      createWriteStream(partial),
    );
    const actual = hash.digest("hex");
    if (actual !== expected) {
      throw mismatch(
        url,
        expected,
        actual,
        "The download does not match the pin, and nothing was cached.",
      );
    }
    await rename(partial, file);
  } finally {
    await rm(partial, { force: true });
  }
}

/**
 * Extracts the verified tarball into a temporary directory and moves the result into place in one rename, so a
 * second runner started at the same time sees either nothing or a complete binary.
 */
async function extract(tarball, target, installDir, expected) {
  const scratch = path.join(
    path.dirname(installDir),
    `.extract-${randomUUID()}`,
  );
  await mkdir(scratch, { recursive: true });
  try {
    const result = spawnSync("tar", ["-xJf", tarball, "-C", scratch], {
      encoding: "utf8",
    });
    if (result.error || result.status !== 0) {
      throw new RunnerError(
        `print-kit: tar could not extract ${tarball}: ${result.error?.message ?? result.stderr.trim()}\n` +
          "The runner needs tar with xz support (Debian: apt-get install xz-utils).",
      );
    }
    const extracted = path.join(scratch, `typst-${target}`);
    if (!existsSync(path.join(extracted, "typst"))) {
      throw new RunnerError(
        `print-kit: ${tarball} holds no typst-${target}/typst.`,
      );
    }
    await chmod(path.join(extracted, "typst"), 0o755);
    await writeFile(path.join(extracted, STAMP), `${expected}\n`);

    await rm(installDir, { recursive: true, force: true });
    try {
      await rename(extracted, installDir);
    } catch (error) {
      // Another runner moved its copy into place first; it came from the same verified tarball.
      if ((await readStamp(installDir)) !== expected) throw error;
    }
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  try {
    const binary = await ensureTypst();
    const result = spawnSync(binary, process.argv.slice(2), {
      stdio: "inherit",
    });
    if (result.error)
      throw new RunnerError(
        `print-kit: cannot run ${binary}: ${result.error.message}`,
      );
    if (result.signal) process.kill(process.pid, result.signal);
    process.exitCode = result.status ?? 1;
  } catch (error) {
    if (!(error instanceof RunnerError)) throw error;
    console.error(error.message);
    process.exitCode = 1;
  }
}
