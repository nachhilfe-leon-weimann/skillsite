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

/** Run `register()` as a fresh server start would; no key means an absent variable. */
async function start(runtime: string, key?: string) {
  vi.stubEnv("NEXT_RUNTIME", runtime);
  vi.stubEnv("CAL_API_KEY", key);
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
