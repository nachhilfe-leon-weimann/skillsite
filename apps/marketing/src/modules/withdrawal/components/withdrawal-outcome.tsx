"use client";

import type { Ref } from "react";
import { CircleAlert, CircleHelp, MailCheck } from "lucide-react";

import { CenteredState } from "@skillsite/ui/layout/centered-state";
import { Button } from "@skillsite/ui/primitives/button";
import { TextLink } from "@skillsite/ui/primitives/link";
import { Text } from "@skillsite/ui/typography/text";
import { withdrawalFallbackEmail, withdrawalText } from "@/content/withdrawal";
import type { WithdrawalResult } from "../model/config";

const text = withdrawalText.result;

/** The fallback address as a mail link; the subject is fixed, never the visitor's input. */
const fallbackHref = `mailto:${withdrawalFallbackEmail}?subject=${encodeURIComponent(text.emailSubject)}`;

type WithdrawalOutcomeProps = {
  /** `null` while the declaration is being sent. */
  result: WithdrawalResult | null;
  titleRef?: Ref<HTMLHeadingElement>;
  onConfirmAgain: () => void;
  onEdit: () => void;
};

type ResultView = {
  icon: React.ReactNode;
  title: string;
  /** Announced with the title; none while sending. */
  message: string | null;
  body: React.ReactNode;
};

/**
 * Step 3: the outcome. Success is shown only for a `sent` result; every
 * other outcome says what happened and the way on, the fallback e-mail
 * address where nothing (or not surely anything) was transmitted.
 */
export function WithdrawalOutcome({
  result,
  titleRef,
  onConfirmAgain,
  onEdit,
}: WithdrawalOutcomeProps) {
  const view = resultView(result, onConfirmAgain, onEdit);
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
      {/* Present from the send on and empty while sending: the outcome is
          announced once. */}
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

/** The message and the fallback address below it. */
function sendByEmail(message: string) {
  return (
    <>
      <Text tone="muted" className="mb-3">
        {message}
      </Text>
      <Text className="font-semibold">
        <TextLink href={fallbackHref}>{withdrawalFallbackEmail}</TextLink>
      </Text>
    </>
  );
}

function resultView(
  result: WithdrawalResult | null,
  onConfirmAgain: () => void,
  onEdit: () => void,
): ResultView {
  const failed = <CircleAlert className="size-7 text-coral" aria-hidden />;

  if (result === null) {
    return {
      icon: (
        <span
          className="size-6 animate-spin rounded-full border-2 border-coral border-t-transparent"
          aria-hidden
        />
      ),
      title: text.pending.title,
      message: null,
      body: <Text tone="muted">{text.pending.text}</Text>,
    };
  }

  switch (result.outcome) {
    case "sent":
      return {
        icon: <MailCheck className="size-7 text-coral" aria-hidden />,
        title: text.sent.title,
        message: `${text.sent.receivedLabel}: ${result.receivedAt}. ${text.sent.text}`,
        body: (
          <>
            <Text className="mb-3">
              <span className="font-semibold">{text.sent.receivedLabel}:</span>{" "}
              {result.receivedAt}
            </Text>
            <Text tone="muted">{text.sent.text}</Text>
          </>
        ),
      };
    case "unknown":
      return {
        icon: <CircleHelp className="size-7 text-coral" aria-hidden />,
        title: text.unknown.title,
        message: text.unknown.text,
        body: sendByEmail(text.unknown.text),
      };
    case "not_sent":
      return {
        icon: failed,
        title: text.notSent.title,
        message: text.notSent.text,
        body: sendByEmail(text.notSent.text),
      };
    case "rejected":
      switch (result.reason) {
        case "too_fast":
          return {
            icon: failed,
            title: text.tooFast.title,
            message: text.tooFast.text,
            body: (
              <>
                <Text tone="muted" className="mb-5">
                  {text.tooFast.text}
                </Text>
                <Button onClick={onConfirmAgain}>{text.confirmAgain}</Button>
              </>
            ),
          };
        case "invalid":
          return {
            icon: failed,
            title: text.invalid.title,
            message: text.invalid.text,
            body: (
              <>
                <Text tone="muted" className="mb-5">
                  {text.invalid.text}
                </Text>
                <Button onClick={onEdit}>{text.edit}</Button>
              </>
            ),
          };
        case "rate_limited":
          return {
            icon: failed,
            title: text.rateLimited.title,
            message: text.rateLimited.text,
            body: sendByEmail(text.rateLimited.text),
          };
        case "blocked":
          return {
            icon: failed,
            title: text.blocked.title,
            message: text.blocked.text,
            body: sendByEmail(text.blocked.text),
          };
      }
  }
}
