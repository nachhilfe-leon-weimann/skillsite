/**
 * Anti-spam heuristics for the public booking action. Pure and clock-free so the
 * rules are unit-testable and never depend on two machines agreeing on the time.
 *
 * A signal is a suspicion, never proof: autofill and password managers write
 * into hidden fields, and people do submit quickly. Callers must therefore
 * answer a signal with an honest, visible failure and log it - never with a
 * feigned success, which tells a real customer "booked" when nothing was.
 */

export type SpamSignal =
  /** The hidden honeypot field carried a value. */
  | "honeypot"
  /** Submitted faster than a human fills the form. Recoverable by retrying. */
  | "too_fast"
  /** No usable fill duration - the request didn't come from the form. */
  | "no_timing";

type AntiSpamOptions = {
  /** Min ms between form mount and submit. */
  readonly minFillMs: number;
};

/**
 * Inspect the anti-spam fields of a raw, untrusted submission. Runs before
 * validation, so it makes no assumption about the input's shape.
 */
export function detectSpamSignal(
  submission: unknown,
  options: AntiSpamOptions,
): SpamSignal | null {
  const { honeypot, fillDurationMs } =
    typeof submission === "object" && submission !== null
      ? (submission as { honeypot?: unknown; fillDurationMs?: unknown })
      : {};

  if (honeypot != null && honeypot !== "") return "honeypot";

  if (
    typeof fillDurationMs !== "number" ||
    !Number.isFinite(fillDurationMs) ||
    fillDurationMs < 0
  ) {
    return "no_timing";
  }
  return fillDurationMs < options.minFillMs ? "too_fast" : null;
}

/**
 * Swap the client-side mount timestamp for the elapsed fill time. Both ends of
 * the measurement come from the client's own clock, so client/server clock skew
 * can't distort it; calling it again on a retry re-measures up to that moment.
 */
export function withFillDuration<Draft extends { formLoadedAt: number }>(
  draft: Draft,
  now: number,
): Omit<Draft, "formLoadedAt"> & { fillDurationMs: number } {
  const { formLoadedAt, ...submission } = draft;
  return {
    ...submission,
    fillDurationMs: Math.max(0, Math.round(now - formLoadedAt)),
  };
}
