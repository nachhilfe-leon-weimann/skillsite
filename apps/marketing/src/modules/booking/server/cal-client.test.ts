import assert from "node:assert/strict";
import { afterEach, beforeEach, test, vi } from "vitest";

const env = vi.hoisted(() => ({
  serverEnv: vi.fn((): { CAL_API_KEY?: string } => ({
    CAL_API_KEY: "cal_live_test",
  })),
}));
vi.mock("@/lib/env", () => env);

import { BOOKING_TIMEOUT_MS, createCalBooking } from "./cal-client";

// Synthetic attendee data; no request ever leaves the test.
const booking = {
  start: "2099-03-02T09:00:00.000Z",
  attendee: { name: "Testa Kundin", email: "testa.kundin@example.com" },
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A Cal.com that never answers: the request only ends when it is aborted. */
function hangUntilAborted(_url: unknown, init?: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () =>
      reject(new DOMException("The operation was aborted.", "AbortError")),
    );
  });
}

test("a booking Cal.com does not confirm in time fails, and is never a success", async () => {
  vi.useFakeTimers();
  fetchMock.mockImplementation(hangUntilAborted);

  const result = createCalBooking(booking);
  await vi.advanceTimersByTimeAsync(BOOKING_TIMEOUT_MS);

  assert.deepEqual(await result, {
    ok: false,
    slotTaken: false,
    failure: { cause: "timeout" },
  });
});

test("a confirmed booking returns Cal.com's uid", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ status: "success", data: { uid: "uid-test" } }),
  );
  assert.deepEqual(await createCalBooking(booking), {
    ok: true,
    uid: "uid-test",
  });
});

test("a Cal.com error carries its status and code, never what the visitor entered", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      {
        status: "error",
        error: {
          code: "BadRequestException",
          message: "testa.kundin@example.com (Testa Kundin) is invalid",
        },
      },
      { status: 400 },
    ),
  );

  const result = await createCalBooking(booking);
  assert.equal(result.ok, false);
  assert.ok(!result.ok);
  assert.equal(result.slotTaken, false);
  assert.equal(result.failure.cause, "http");
  assert.equal(result.failure.status, 400);
  assert.equal(result.failure.code, "BadRequestException");
  for (const value of ["testa", "Testa", "Kundin", "example.com"]) {
    assert.ok(!JSON.stringify(result.failure).includes(value));
  }
});

test("a taken slot is told apart from a generic failure", async () => {
  fetchMock.mockResolvedValue(new Response("", { status: 409 }));
  const conflict = await createCalBooking(booking);
  assert.ok(!conflict.ok && conflict.slotTaken);

  fetchMock.mockResolvedValue(
    Response.json(
      { error: { message: "This slot is no longer available" } },
      { status: 400 },
    ),
  );
  const gone = await createCalBooking(booking);
  assert.ok(!gone.ok && gone.slotTaken);
});

test("an unreachable Cal.com fails as a network error", async () => {
  fetchMock.mockRejectedValue(new TypeError("fetch failed"));
  assert.deepEqual(await createCalBooking(booking), {
    ok: false,
    slotTaken: false,
    failure: { cause: "network", message: "TypeError: fetch failed" },
  });
});

test("without an API key nothing is sent", async () => {
  env.serverEnv.mockReturnValueOnce({});
  assert.deepEqual(await createCalBooking(booking), {
    ok: false,
    slotTaken: false,
    failure: { cause: "unconfigured" },
  });
  assert.equal(fetchMock.mock.calls.length, 0);
});
