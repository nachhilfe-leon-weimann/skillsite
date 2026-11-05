"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useHydrated } from "@skillsite/ui/hooks/use-hydrated";
import {
  BOOKING_TIMEZONE,
  type AvailabilityResponse,
  type AvailabilityStatus,
  type BookingEventKey,
} from "../model/config";
import { bookingToday, shownMonth } from "../model/dates";

/** The last bookable month, counted from the current one. */
export const MAX_MONTH_OFFSET = 3;

/**
 * The booking day: the server's while hydrating, the visitor's from then on.
 * `/termin` is prerendered, so its HTML carries the build day; reading the clock
 * during hydration would mismatch on every later day and make React throw the
 * server HTML away. The visitor's day is read once per mount, so the shown month
 * and the booking window stay put when midnight passes with the page open.
 */
function useBookingToday(renderedToday: string) {
  const hydrated = useHydrated();
  const [visitorToday] = useState(bookingToday);
  return { today: hydrated ? visitorToday : renderedToday, hydrated };
}

/**
 * The free days of the shown month for an event and duration: it fetches them,
 * aborts a request that a newer one replaces, and while searching skips empty
 * months up to `MAX_MONTH_OFFSET`. A new duration is a new search: change it
 * together with `restartSearch()`, which shows the loading state and skips
 * empty months again; the new duration alone only refetches the shown month.
 *
 * @param onFirstFreeDay receives the soonest free day of each month that has
 *   one; the latest callback is used, and a new one never refetches.
 * @param renderedToday the booking day the server rendered for
 *   (`bookingToday()` in the page).
 */
export function useAvailability(
  event: BookingEventKey,
  duration: number,
  onFirstFreeDay: (date: string) => void,
  renderedToday: string,
) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  // Auto-skip empty months only while searching (initial load / duration
  // change). Manual month navigation switches this off so going "back" into an
  // empty month doesn't bounce the user forward again.
  const autoAdvance = useRef(true);
  const firstFreeDay = useRef(onFirstFreeDay);

  const { today, hydrated } = useBookingToday(renderedToday);
  const shown = useMemo(
    () => shownMonth(today, monthOffset),
    [today, monthOffset],
  );

  // The latest callback, without making it a dependency of the fetch.
  useEffect(() => {
    firstFreeDay.current = onFirstFreeDay;
  });

  useEffect(() => {
    // The server's day may name another month: fetch only the visitor's.
    if (!hydrated) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      event,
      duration: String(duration),
      year: String(shown.year),
      month: String(shown.month),
    });
    fetch(`/api/booking/availability?${query}`, { signal: controller.signal })
      .then((res) => {
        // A non-OK response (e.g. 400) isn't an AvailabilityResponse — treat it
        // as an error instead of letting a missing `status` read as "ok".
        if (!res.ok)
          throw new Error(`Availability request failed: ${res.status}`);
        return res.json();
      })
      .then((data: AvailabilityResponse) => {
        setAvailability(data);
        setLoading(false);
        if (data.status !== "ok") return;
        const firstDay = data.days[0];
        if (firstDay) {
          // Preselect the soonest free day so its times show right away.
          firstFreeDay.current(firstDay.date);
        } else if (autoAdvance.current && monthOffset < MAX_MONTH_OFFSET) {
          // Empty month → hop forward to the next month with free slots, but
          // only while auto-searching, never in response to manual navigation.
          setMonthOffset((current) => Math.min(MAX_MONTH_OFFSET, current + 1));
          setLoading(true);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setAvailability({
          status: "error",
          timeZone: BOOKING_TIMEZONE,
          days: [],
        });
        setLoading(false);
      });
    return () => controller.abort();
  }, [
    event,
    duration,
    shown.year,
    shown.month,
    reloadKey,
    monthOffset,
    hydrated,
  ]);

  /** Explicit navigation: respect the chosen month, don't auto-skip past it. */
  const changeMonth = (delta: number) => {
    autoAdvance.current = false;
    setMonthOffset((current) =>
      Math.min(MAX_MONTH_OFFSET, Math.max(0, current + delta)),
    );
    setLoading(true);
  };

  /** Load the shown month again. */
  const retry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  /** A fresh search: reload and skip to the soonest free month again. */
  const restartSearch = () => {
    autoAdvance.current = true;
    retry();
  };

  const status: AvailabilityStatus = availability?.status ?? "ok";

  return {
    today,
    shown,
    monthOffset,
    availability,
    loading,
    status,
    changeMonth,
    restartSearch,
    retry,
  };
}
