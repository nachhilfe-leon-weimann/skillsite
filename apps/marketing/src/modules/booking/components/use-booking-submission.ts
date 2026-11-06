"use client";

import { useState } from "react";

import { bookerText } from "@/content/booking";
import { trackEvent } from "@/lib/analytics";
import { withFillDuration } from "../model/anti-spam";
import type {
  BookingDraft,
  BookingEventKey,
  SubmitFailureReason,
} from "../model/config";
import { requestBooking } from "../server/actions";

export type BookingPhase = "pending" | "confirmed" | "failed";

export type BookingError = {
  message: string;
  reason: SubmitFailureReason;
};

/**
 * Sends a booking and holds its outcome: `pending` until Cal.com answers,
 * `confirmed` only once it confirmed the booking, `failed` with the reason
 * otherwise. Reports each outcome to analytics.
 */
export function useBookingSubmission(event: BookingEventKey, duration: number) {
  const [phase, setPhase] = useState<BookingPhase>("pending");
  const [error, setError] = useState<BookingError | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  // Send the booking to Cal.com. We moved off the slot picker but wait on the
  // real result before claiming success — Cal's create pipeline (mail, calendar
  // event, webhooks) takes a few seconds, and a slot can be gone by now, so we
  // never tell the user "sent" until Cal.com confirms it.
  const finalizeBooking = async (sent: BookingDraft) => {
    setPhase("pending");
    try {
      // Measured per send, so a retry carries the time elapsed up to the retry.
      const result = await requestBooking(
        withFillDuration(sent, performance.now()),
      );
      if (result.ok) {
        setPhase("confirmed");
        // Conversion: a booking was actually confirmed by Cal.com.
        trackEvent("booking-confirmed", { type: event, duration });
      } else {
        setError({
          message: result.error,
          reason: result.reason,
        });
        setPhase("failed");
        trackEvent("booking-failed", { type: event, reason: result.reason });
      }
    } catch {
      setError({
        message: bookerText.result.genericFailure,
        reason: "generic",
      });
      setPhase("failed");
      // The request never produced a result (offline, stale deployment), so the
      // server log has no outcome line - this event is the only trace.
      trackEvent("booking-failed", { type: event, reason: "request_error" });
    }
  };

  /** Send a new draft; it is kept for `retryBooking`. */
  const submit = (next: BookingDraft) => {
    setDraft(next);
    setError(null);
    void finalizeBooking(next);
  };

  /** Send the kept draft again. */
  const retryBooking = () => {
    if (!draft) return;
    setError(null);
    void finalizeBooking(draft);
  };

  /** Forget the draft and its error, for a fresh selection. */
  const reset = () => {
    setError(null);
    setDraft(null);
  };

  return { phase, error, submit, retryBooking, reset };
}
