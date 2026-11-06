"use client";

import Link from "next/link";
import { CalendarX2, Check, Phone, Video } from "lucide-react";

import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { InfoRow } from "@skillsite/ui/primitives/info-row";
import { CenteredState } from "@skillsite/ui/layout/centered-state";
import { Text } from "@skillsite/ui/typography/text";
import { bookerText } from "@/content/booking";
import { routes } from "@/lib/routes";
import type { BookingEventKey } from "../model/config";
import type { BookingError, BookingPhase } from "./use-booking-submission";

type BookingResultProps = {
  phase: BookingPhase;
  summary: string | null;
  event: BookingEventKey;
  error: BookingError | null;
  onRetry: () => void;
  onChooseAnother: () => void;
};

/**
 * The last step: the booking while Cal.com confirms it, then its outcome with
 * the way on that fits it.
 */
export function BookingResult({
  phase,
  summary,
  event,
  error,
  onRetry,
  onChooseAnother,
}: BookingResultProps) {
  if (phase === "pending") {
    return (
      <CenteredState
        icon={
          <span
            className="size-6 animate-spin rounded-full border-2 border-coral border-t-transparent"
            aria-hidden
          />
        }
        title={bookerText.result.pending.title}
      >
        <Text tone="muted" aria-live="polite">
          {bookerText.result.pending.text}
        </Text>
      </CenteredState>
    );
  }

  if (phase === "confirmed") {
    return (
      <CenteredState
        icon={<Check className="size-7 text-coral" aria-hidden />}
        title={bookerText.result.confirmed.title}
      >
        {summary ? (
          <Card
            asChild
            surface="inset"
            className="mx-auto mb-5 max-w-xs p-3.5 text-left"
          >
            <InfoRow
              variant="summary"
              label={bookerText.result.confirmed.summaryLabel}
              icon={
                event === "kennenlernen" ? (
                  <Phone className="size-4" aria-hidden />
                ) : (
                  <Video className="size-4" aria-hidden />
                )
              }
            >
              {summary}
            </InfoRow>
          </Card>
        ) : null}
        <Text tone="muted" className="mb-6">
          {bookerText.result.confirmed.text[event]}
        </Text>
        <Button variant="outline" onClick={onChooseAnother}>
          {bookerText.result.confirmed.action[event]}
        </Button>
      </CenteredState>
    );
  }

  const message = error?.message ?? bookerText.result.genericFailure;

  // Retrying can't help in either case - point to the direct contact instead.
  if (error?.reason === "rate_limited" || error?.reason === "blocked") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title={
          error.reason === "blocked"
            ? bookerText.result.blockedTitle
            : bookerText.result.rateLimitedTitle
        }
      >
        <Text tone="muted" className="mb-5">
          {message}
        </Text>
        <Button asChild variant="primary">
          <Link href={routes.contact}>{bookerText.directContact}</Link>
        </Button>
      </CenteredState>
    );
  }

  if (error?.reason === "slot_taken") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title={bookerText.result.slotTakenTitle}
      >
        <Text tone="muted" className="mb-5">
          {message}
        </Text>
        <Button onClick={onChooseAnother}>
          {bookerText.result.chooseAnother}
        </Button>
      </CenteredState>
    );
  }

  return (
    <CenteredState
      icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
      title={bookerText.result.failedTitle}
    >
      <Text tone="muted" className="mb-5">
        {message}
      </Text>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onRetry}>{bookerText.result.resend}</Button>
        <Button variant="outline" onClick={onChooseAnother}>
          {bookerText.result.chooseAnother}
        </Button>
      </div>
    </CenteredState>
  );
}
