import assert from "node:assert/strict";
import { afterEach, beforeEach, test, vi } from "vitest";

import type { WithdrawalMailConfig } from "@/lib/env";
import type { WithdrawalSubmission } from "../model/config";

// Synthetic configuration and data only. Every Graph call is a mocked fetch.
const config: WithdrawalMailConfig = {
  tenantId: "00000000-0000-4000-8000-000000000001",
  clientId: "00000000-0000-4000-8000-000000000002",
  clientSecret: "synthetic-secret",
  mailbox: "widerruf@example.com",
};

const env = vi.hoisted(() => ({
  config: null as WithdrawalMailConfig | null,
}));
vi.mock("@/lib/env", () => ({ withdrawalMailConfig: () => env.config }));

// Every request comes from its own address unless a test pins one.
const ip = vi.hoisted(() => ({ next: 0, fixed: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({
      "x-forwarded-for": ip.fixed ?? `198.51.100.${(ip.next += 1) % 250}`,
    }),
}));

/** The action from a fresh module graph: its rate limit starts empty in every test. */
async function submitWithdrawal(input: WithdrawalSubmission) {
  const { submitWithdrawal: action } = await import("./actions");
  return action(input);
}

const values = {
  name: "Erika Beispiel",
  email: "erika@example.com",
  contract: "Gebuchter Termin am 24.11.2026",
  note: "Bitte bestätigen Sie den Widerruf.",
};

const submission = (
  overrides: Partial<WithdrawalSubmission> = {},
): WithdrawalSubmission => ({
  values,
  honeypot: "",
  fillDurationMs: 20_000,
  ...overrides,
});

type GraphAnswers = {
  token?: () => Response;
  acknowledgement?: () => Response;
  notice?: () => Response;
};

/** Answers Graph like a healthy tenant unless told otherwise; records each mail. */
function stubGraph(answers: GraphAnswers = {}) {
  const mails: { to: string; subject: string; body: string }[] = [];
  const fetch = vi.fn(async (url: URL, init?: RequestInit) => {
    if (url.hostname === "login.microsoftonline.com") {
      return (answers.token ?? (() => Response.json({ access_token: "t" })))();
    }
    const { message } = JSON.parse(String(init?.body)) as {
      message: {
        subject: string;
        body: { content: string };
        toRecipients: { emailAddress: { address: string } }[];
      };
    };
    const to = message.toRecipients[0]!.emailAddress.address;
    mails.push({ to, subject: message.subject, body: message.body.content });
    const answer =
      to === config.mailbox ? answers.notice : answers.acknowledgement;
    return (answer ?? (() => new Response(null, { status: 202 })))();
  });
  vi.stubGlobal("fetch", fetch);
  return { fetch, mails };
}

const logs: { level: string; line: string }[] = [];

beforeEach(() => {
  vi.resetModules();
  env.config = config;
  ip.fixed = null;
  logs.length = 0;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-16T21:41:05Z"));
  for (const level of ["info", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation((line: unknown) => {
      logs.push({ level, line: String(line) });
    });
  }
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** The one outcome line of the attempt. */
function outcomeLine() {
  const lines = logs.filter(({ line }) => line.startsWith("[withdrawal] "));
  assert.equal(lines.length, 1, "exactly one outcome line per attempt");
  return lines[0]!;
}

test("a confirmed withdrawal sends the acknowledgement and the notice, then reports its receipt", async () => {
  const { mails } = stubGraph();

  assert.deepEqual(await submitWithdrawal(submission()), {
    outcome: "sent",
    receivedAt: "16.11.2026, 22:41:05 MEZ",
  });

  assert.deepEqual(
    mails.map(({ to, subject }) => ({ to, subject })),
    [
      {
        to: "erika@example.com",
        subject: "Eingangsbestätigung Ihres Widerrufs",
      },
      { to: config.mailbox, subject: "Neuer Widerruf: Erika Beispiel" },
    ],
  );
  // Both mails carry the full declaration and the date and time of receipt.
  for (const { body } of mails) {
    for (const part of [
      "Eingang: 16.11.2026, 22:41:05 MEZ",
      "Hiermit widerrufe ich den folgenden Vertrag.",
      values.name,
      values.email,
      values.contract,
      values.note,
    ]) {
      assert.ok(body.includes(part), `missing: ${part}`);
    }
  }
  assert.match(outcomeLine().line, /^\[withdrawal\] sent /);
});

test("the log line keeps a masked e-mail only: no name, no contract, no note", async () => {
  stubGraph();
  await submitWithdrawal(submission());
  const { line } = outcomeLine();
  assert.ok(line.includes("er***@example.com"));
  for (const secret of [
    values.name,
    values.email,
    values.contract,
    values.note,
    "198.51.100",
  ]) {
    assert.ok(!line.includes(secret), `logged: ${secret}`);
  }
});

test("unconfigured, nothing is sent and the consumer is told to use e-mail", async () => {
  env.config = null;
  const { fetch } = stubGraph();
  assert.deepEqual(await submitWithdrawal(submission()), {
    outcome: "not_sent",
  });
  assert.equal(fetch.mock.calls.length, 0);
  assert.match(outcomeLine().line, /^\[withdrawal\] unconfigured /);
});

test("a refused token sends nothing and is never reported as sent", async () => {
  const { mails } = stubGraph({
    token: () => new Response("{}", { status: 401 }),
  });
  assert.deepEqual(await submitWithdrawal(submission()), {
    outcome: "not_sent",
  });
  assert.equal(mails.length, 0);
  assert.match(outcomeLine().line, /^\[withdrawal\] failed .*"status":401/);
});

test("a refused acknowledgement is never reported as sent; the notice asks the provider to acknowledge by hand", async () => {
  const { mails } = stubGraph({
    acknowledgement: () => new Response("{}", { status: 403 }),
  });
  assert.deepEqual(await submitWithdrawal(submission()), {
    outcome: "not_sent",
  });
  assert.deepEqual(
    mails.map(({ to }) => to),
    ["erika@example.com", config.mailbox],
  );
  const notice = mails[1]!.body;
  assert.ok(notice.includes("NICHT gesendet"));
  assert.ok(notice.includes(values.contract));
  assert.match(outcomeLine().line, /^\[withdrawal\] failed .*"status":403/);
});

test("the overall limit counts only declarations about to be sent", async () => {
  const { mails } = stubGraph();
  // Junk from many addresses never uses the budget up.
  for (let junk = 0; junk < 40; junk += 1) {
    await submitWithdrawal(submission({ honeypot: "x" }));
    await submitWithdrawal(submission({ values: { ...values, email: "x" } }));
  }
  assert.equal((await submitWithdrawal(submission())).outcome, "sent");

  for (let sent = 1; sent < 30; sent += 1) {
    await submitWithdrawal(submission());
  }
  logs.length = 0;
  assert.deepEqual(await submitWithdrawal(submission()), {
    outcome: "rejected",
    reason: "rate_limited",
  });
  const { level, line } = outcomeLine();
  assert.equal(level, "error");
  assert.match(line, /^\[withdrawal\] unavailable /);
  assert.equal(mails.length, 30 * 2);
});

test("an acknowledgement without Graph's 202 is unknown, and the notice tells the provider", async () => {
  for (const acknowledgement of [
    () => new Response(null, { status: 500 }),
    () => new Response(null, { status: 200 }),
    () => {
      throw new DOMException("timed out", "TimeoutError");
    },
  ]) {
    logs.length = 0;
    const { mails } = stubGraph({ acknowledgement });
    assert.deepEqual(await submitWithdrawal(submission()), {
      outcome: "unknown",
    });
    const notice = mails.find(({ to }) => to === config.mailbox);
    assert.ok(notice?.body.includes("ist unklar"));
    assert.match(outcomeLine().line, /^\[withdrawal\] unknown /);
  }
});

test("a failed notice still reports the sent acknowledgement, and the log says so", async () => {
  stubGraph({ notice: () => new Response(null, { status: 503 }) });
  assert.deepEqual(await submitWithdrawal(submission()), {
    outcome: "sent",
    receivedAt: "16.11.2026, 22:41:05 MEZ",
  });
  const { level, line } = outcomeLine();
  assert.equal(level, "error");
  assert.match(line, /^\[withdrawal\] sent_without_notice /);
});

test("a filled honeypot is a visible refusal and sends nothing", async () => {
  const { fetch } = stubGraph();
  assert.deepEqual(
    await submitWithdrawal(submission({ honeypot: "Muster GmbH" })),
    { outcome: "rejected", reason: "blocked" },
  );
  assert.equal(fetch.mock.calls.length, 0);
  const { line } = outcomeLine();
  assert.match(line, /^\[withdrawal\] blocked .*"signal":"honeypot"/);
  // The honeypot may hold what autofill wrote: never logged.
  assert.ok(!line.includes("Muster GmbH"));
});

test("a confirmation faster than the time trap asks to confirm again and sends nothing", async () => {
  const { fetch } = stubGraph();
  assert.deepEqual(
    await submitWithdrawal(submission({ fillDurationMs: 1_200 })),
    { outcome: "rejected", reason: "too_fast" },
  );
  assert.deepEqual(
    await submitWithdrawal({
      values,
      honeypot: "",
    } as unknown as WithdrawalSubmission),
    { outcome: "rejected", reason: "blocked" },
  );
  assert.equal(fetch.mock.calls.length, 0);
});

test("invalid values are refused with their fields and send nothing", async () => {
  const { fetch } = stubGraph();
  assert.deepEqual(
    await submitWithdrawal(
      submission({ values: { ...values, email: "erika", contract: "" } }),
    ),
    { outcome: "rejected", reason: "invalid", fields: ["email", "contract"] },
  );
  assert.equal(fetch.mock.calls.length, 0);
});

test("an address over the rate limit is refused visibly and sends nothing more", async () => {
  ip.fixed = "203.0.113.7";
  const { mails } = stubGraph();
  const results = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    results.push(await submitWithdrawal(submission()));
  }
  assert.deepEqual(results.at(-1), {
    outcome: "rejected",
    reason: "rate_limited",
  });
  assert.equal(mails.length, 5 * 2);
});

test("a malformed submission never crashes the action", async () => {
  const { fetch } = stubGraph();
  const result = await submitWithdrawal(
    null as unknown as WithdrawalSubmission,
  );
  assert.equal(result.outcome, "rejected");
  assert.equal(fetch.mock.calls.length, 0);
});
