import { NextResponse } from "next/server";

import { getAvailability } from "./availability";
import {
  AvailabilityRateLimiter,
  availabilityClientId,
  resolveAvailabilityDuration,
} from "./availability-guard";
import { bookingEvents, type BookingEventKey } from "../model/config";

const availabilityRateLimiter = new AvailabilityRateLimiter();

/**
 * `GET /api/booking/availability`: a per-client rate limit, then the event,
 * month and duration from the query, then that month's open slots.
 */
export async function handleAvailabilityRequest(
  request: Request,
): Promise<Response> {
  const rateLimit = availabilityRateLimiter.check(
    availabilityClientId(request.headers),
  );
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1_000)),
        },
      },
    );
  }

  const params = new URL(request.url).searchParams;
  const eventParam = params.get("event");

  if (!eventParam || !Object.hasOwn(bookingEvents, eventParam)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }
  const event = eventParam as BookingEventKey;

  const now = new Date();
  const eventConfig = bookingEvents[event];
  const year = Number(params.get("year")) || now.getFullYear();
  const month = Number(params.get("month")) || now.getMonth() + 1;
  const durationMinutes = resolveAvailabilityDuration(
    params.get("duration"),
    eventConfig.defaultDuration,
    eventConfig.durations,
  );

  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }
  if (durationMinutes === null) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const data = await getAvailability({ event, year, month, durationMinutes });
  return NextResponse.json(data);
}
