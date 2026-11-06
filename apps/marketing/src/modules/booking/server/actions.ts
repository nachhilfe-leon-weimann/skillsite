"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";

import { bookerText } from "@/content/booking";

import {
  ANTI_SPAM,
  CAL_SLOTS_TAG,
  type BookingSubmission,
  type SubmitResult,
} from "../model/config";
import { detectSpamSignal } from "../model/anti-spam";
import { checkRateLimit } from "./rate-limit";
import { checkBookingSubmission, type BookingIssue } from "../model/schema";
import { buildCalBookingBody } from "../model/mapping";
import { createCalBooking } from "./cal-client";
import { describeAttempt, logBooking } from "./log";

/**
 * Real client IP behind Traefik (Dokploy). Traefik sets `x-forwarded-for` and
 * strips client-spoofed values as long as the app is only reachable via Traefik;
 * the first entry is the original client.
 */
async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip")?.trim() || "unknown";
}

const GENERIC_FAILURE: SubmitResult = {
  ok: false,
  reason: "generic",
  error: bookerText.result.genericFailure,
};

/** The message a visitor sees for each reason the action turns a submission down. */
function issueMessage(issue: BookingIssue): string {
  switch (issue.check) {
    case "slot":
      return "Bitte wähle einen Termin.";
    case "fields":
      return `Bitte überprüfe deine Eingaben: ${issue.fields.join(", ")}.`;
    case "terms":
      return "Bitte bestätige die AGB.";
    case "withdrawal_notice":
      return "Bitte bestätige den Hinweis zum Widerrufsrecht.";
  }
}

/**
 * Create a booking in Cal.com from a validated submission. Public endpoint, so
 * it re-runs the full schema validation and only forwards whitelisted values.
 *
 * Two guarantees hold on every path: success is only ever reported for a
 * booking Cal.com confirmed, and each attempt leaves one outcome line in the log.
 */
export async function requestBooking(
  submission: BookingSubmission,
): Promise<SubmitResult> {
  const attempt = describeAttempt(submission);
  try {
    return await processBooking(submission, attempt);
  } catch (error) {
    // A bug or an unexpected input shape - still one outcome line, not a bare 500.
    logBooking("failed", { ...attempt, error: String(error) });
    console.error("[booking] unexpected error while booking", error);
    return GENERIC_FAILURE;
  }
}

/** Thin orchestration: rate-limit -> anti-spam -> check -> map -> Cal client. */
async function processBooking(
  submission: BookingSubmission,
  attempt: Record<string, unknown>,
): Promise<SubmitResult> {
  // Layer 1 - per-IP rate limit (counts every attempt, including ones blocked below).
  const ip = await clientIp();
  if (!checkRateLimit(ip).ok) {
    logBooking("rate_limited", attempt);
    return {
      ok: false,
      reason: "rate_limited",
      error:
        "Zu viele Anfragen in kurzer Zeit. Bitte versuch es später erneut oder schreib mir direkt.",
    };
  }

  // Layer 2 - honeypot and time-trap. Both are heuristics that real customers
  // can trip (autofill writes into hidden fields), so a hit is answered with a
  // visible failure and logged. Never feign success here: the customer would
  // leave believing in a booking that doesn't exist.
  const spamSignal = detectSpamSignal(submission, ANTI_SPAM);
  if (spamSignal) {
    logBooking("blocked", { signal: spamSignal, ...attempt });
    // Too fast resolves itself: the retry re-measures and passes.
    if (spamSignal === "too_fast") {
      return {
        ok: false,
        reason: "too_fast",
        error:
          "Das ging schneller, als mein Spamschutz erlaubt. Es wurde noch kein Termin gebucht – bitte sende die Buchung einfach noch einmal.",
      };
    }
    return {
      ok: false,
      reason: "blocked",
      error:
        "Mein Spamschutz hat diese Buchung leider aufgehalten. Es wurde kein Termin gebucht – bitte schreib mir kurz direkt, dann trage ich dich ein.",
    };
  }

  // The form validates the same schema, so a rejection here means client and
  // server disagree (or the request was hand-made) - worth a log line either way.
  const rejected = (
    check: Record<string, unknown>,
    error: string,
  ): SubmitResult => {
    logBooking("rejected", { ...check, ...attempt });
    return { ok: false, reason: "validation", error };
  };

  // A malformed shape throws here, into `requestBooking`'s catch.
  const issue = checkBookingSubmission(submission);
  if (issue) return rejected(issue, issueMessage(issue));

  const result = await createCalBooking(buildCalBookingBody(submission));

  // A booked or gone slot both change availability, so drop the cached view in
  // either case. A generic failure leaves the slot intact - keep the cache.
  if (result.ok) {
    logBooking("created", { ...attempt, calUid: result.uid });
    updateTag(CAL_SLOTS_TAG);
    return { ok: true };
  }
  if (result.slotTaken) {
    logBooking("slot_taken", attempt);
    updateTag(CAL_SLOTS_TAG);
    return {
      ok: false,
      reason: "slot_taken",
      error:
        "Dieser Termin wurde gerade vergeben. Bitte wähle einen anderen Zeitpunkt.",
    };
  }
  logBooking("failed", attempt);
  return GENERIC_FAILURE;
}
