"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, type RefObject } from "react";
import { CalendarClock, CalendarX2 } from "lucide-react";

import { Button } from "@skillsite/ui/primitives/button";
import { CenteredState } from "@skillsite/ui/layout/centered-state";
import { Text } from "@skillsite/ui/typography/text";
import { bookerText } from "@/content/booking";
import { routes } from "@/lib/routes";

/**
 * Stands in for the calendar when no availability can be shown: an `error`
 * offers a retry, `unconfigured` (no Cal.com key) the direct contact.
 */
export function UnavailableNotice({
  status,
  onRetry,
  takeFocusRef,
}: {
  status: "unconfigured" | "error";
  onRetry: () => void;
  /** Set when this notice replaced the calendar while its grid held focus. */
  takeFocusRef: RefObject<boolean>;
}) {
  const retryRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // The calendar grid this notice replaced held focus, which its removal
  // dropped: hand it to the Retry button, or else to the notice itself. Focus
  // anywhere else stays where it is.
  useLayoutEffect(() => {
    if (!takeFocusRef.current) return;
    takeFocusRef.current = false;
    (retryRef.current ?? statusRef.current)?.focus();
  }, [takeFocusRef]);

  if (status === "error") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title={bookerText.unavailable.error.title}
      >
        <Text tone="muted" className="mb-5">
          {bookerText.unavailable.error.text}
        </Text>
        <Button ref={retryRef} variant="outline" onClick={onRetry}>
          {bookerText.unavailable.error.retry}
        </Button>
      </CenteredState>
    );
  }

  return (
    <CenteredState
      ref={statusRef}
      tabIndex={-1}
      icon={<CalendarClock className="size-7 text-coral" aria-hidden />}
      title={bookerText.unavailable.unconfigured.title}
    >
      <Text tone="muted" className="mb-5">
        {bookerText.unavailable.unconfigured.text}
      </Text>
      <Button asChild variant="primary">
        <Link href={routes.contact}>{bookerText.directContact}</Link>
      </Button>
    </CenteredState>
  );
}
