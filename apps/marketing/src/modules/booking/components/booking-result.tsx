"use client";

import Link from "next/link";
import type { Ref } from "react";
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
  /** The title, where focus goes when this step replaces the control that was used. */
  titleRef?: Ref<HTMLHeadingElement>;
  onRetry: () => void;
  onChooseAnother: () => void;
};

/** What the step shows in a phase. */
type ResultView = {
  icon: React.ReactNode;
  title: string;
  /** The outcome's message, announced with the title; none while booking. */
  message: string | null;
  /** The message and the way on, below the title. */
  body: React.ReactNode;
};

/**
 * The last step: the booking while Cal.com confirms it, then its outcome with
 * the way on that fits it. Every phase renders the same state, so its title
 * keeps focus from booking to outcome; a status region announces the outcome.
 */
export function BookingResult({
  phase,
  summary,
  event,
  error,
  titleRef,
  onRetry,
  onChooseAnother,
}: BookingResultProps) {
  const view = resultView({
    phase,
    summary,
    event,
    error,
    onRetry,
    onChooseAnother,
  });
  return (
    <>
      <CenteredState
        icon={view.icon}
        title={view.title}
        focusableTitle
        titleRef={titleRef}
      >
        {view.body}
      </CenteredState>
      {/* Exists from the send on and stays empty while booking: the outcome is
          announced once, a resend (whose title takes focus) not twice. */}
      <div role="status" className="sr-only">
        {view.message ? (
          <>
            <p>{view.title}</p>
            <p>{view.message}</p>
          </>
        ) : null}
      </div>
    </>
  );
}

function resultView({
  phase,
  summary,
  event,
  error,
  onRetry,
  onChooseAnother,
}: Omit<BookingResultProps, "titleRef">): ResultView {
  if (phase === "pending") {
    return {
      icon: (
        <span
          className="size-6 animate-spin rounded-full border-2 border-coral border-t-transparent"
          aria-hidden
        />
      ),
      title: bookerText.result.pending.title,
      message: null,
      body: (
        <Text tone="muted" aria-live="polite">
          {bookerText.result.pending.text}
        </Text>
      ),
    };
  }

  if (phase === "confirmed") {
    return {
      icon: <Check className="size-7 text-coral" aria-hidden />,
      title: bookerText.result.confirmed.title,
      message: bookerText.result.confirmed.text[event],
      body: (
        <>
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
        </>
      ),
    };
  }

  const message = error?.message ?? bookerText.result.genericFailure;
  const failureIcon = <CalendarX2 className="size-7 text-coral" aria-hidden />;

  // Retrying can't help in either case - point to the direct contact instead.
  if (error?.reason === "rate_limited" || error?.reason === "blocked") {
    return {
      icon: failureIcon,
      title:
        error.reason === "blocked"
          ? bookerText.result.blockedTitle
          : bookerText.result.rateLimitedTitle,
      message,
      body: (
        <>
          <Text tone="muted" className="mb-5">
            {message}
          </Text>
          <Button asChild variant="primary">
            <Link href={routes.contact}>{bookerText.directContact}</Link>
          </Button>
        </>
      ),
    };
  }

  if (error?.reason === "slot_taken") {
    return {
      icon: failureIcon,
      title: bookerText.result.slotTakenTitle,
      message,
      body: (
        <>
          <Text tone="muted" className="mb-5">
            {message}
          </Text>
          <Button onClick={onChooseAnother}>
            {bookerText.result.chooseAnother}
          </Button>
        </>
      ),
    };
  }

  return {
    icon: failureIcon,
    title: bookerText.result.failedTitle,
    message,
    body: (
      <>
        <Text tone="muted" className="mb-5">
          {message}
        </Text>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={onRetry}>{bookerText.result.resend}</Button>
          <Button variant="outline" onClick={onChooseAnother}>
            {bookerText.result.chooseAnother}
          </Button>
        </div>
      </>
    ),
  };
}
