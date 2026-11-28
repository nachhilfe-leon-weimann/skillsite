import { afterEach, beforeEach, expect, test, vi } from "vitest";

let exit: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetModules();
  exit = vi
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never);
  error = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const SKILLFORGE_VARIABLES = [
  "SKILLFORGE_API_URL",
  "SKILLFORGE_CLIENT_ID",
  "SKILLFORGE_CLIENT_SECRET",
] as const;

/**
 * Run `register()` as a fresh server start would; no key means an absent variable. The SkillForge connection is
 * absent unless `skillforge` sets part of it, whatever the shell running the tests holds.
 */
async function start(
  runtime: string,
  key?: string,
  skillforge: Partial<
    Record<(typeof SKILLFORGE_VARIABLES)[number], string>
  > = {},
) {
  vi.stubEnv("NEXT_RUNTIME", runtime);
  vi.stubEnv("CAL_API_KEY", key);
  for (const name of SKILLFORGE_VARIABLES) vi.stubEnv(name, skillforge[name]);
  const { register } = await import("./instrumentation");
  await register();
}

test("a malformed key on the Node runtime logs one [env] line and exits", async () => {
  await start("nodejs", "not-a-key");

  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toMatch(/^\[env\] /);
  expect(String(error.mock.calls[0]?.[0])).not.toContain("not-a-key");
  expect(exit).toHaveBeenCalledExactlyOnceWith(1);
});

test("a partial SkillForge connection on the Node runtime logs one [env] line and exits", async () => {
  await start("nodejs", undefined, {
    SKILLFORGE_CLIENT_ID: "marketing-e2e",
    SKILLFORGE_CLIENT_SECRET: "sf_synthetic_secret",
  });

  expect(error).toHaveBeenCalledTimes(1);
  const message = String(error.mock.calls[0]?.[0]);
  expect(message).toMatch(/^\[env\] SKILLFORGE_API_URL missing/);
  expect(message).not.toContain("sf_synthetic_secret");
  expect(exit).toHaveBeenCalledExactlyOnceWith(1);
});

test.each([
  ["empty", ""],
  ["absent", undefined],
])("an %s key on the Node runtime passes", async (_name, key) => {
  await start("nodejs", key);

  expect(error).not.toHaveBeenCalled();
  expect(exit).not.toHaveBeenCalled();
});

test("the Edge runtime never reads the env module", async () => {
  await start("edge", "not-a-key");

  expect(error).not.toHaveBeenCalled();
  expect(exit).not.toHaveBeenCalled();
});
