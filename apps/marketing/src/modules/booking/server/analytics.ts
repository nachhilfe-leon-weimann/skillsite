import "server-only";

import { headers } from "next/headers";
import { after } from "next/server";
import * as z from "zod/mini";

import { sendToUmami } from "@/lib/analytics/send";
import { eventPayload } from "@/lib/analytics/umami";
import { routes } from "@/lib/routes";

import type { ClientBookingEvent } from "../model/analytics";
import {
  bookingEvents,
  type BookingEventKey,
  type SubmitResult,
} from "../model/config";

/** The page each booking widget sits on, for an event whose request names no page. */
const BOOKING_PAGES = {
  kennenlernen: routes.contact,
  nachhilfe: routes.booking,
} satisfies Record<BookingEventKey, string>;

/** Longest event body read: a funnel step is a few dozen bytes. */
const MAX_EVENT_BODY_LENGTH = 512;

const bookingType = z.custom<BookingEventKey>(
  (type) => typeof type === "string" && Object.hasOwn(bookingEvents, type),
);

/**
 * The only events a browser may report. Anything else - another name, another
 * reason, an unknown booking type - is dropped; unknown keys are stripped.
 */
export const clientBookingEventSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("booking-started"), type: bookingType }),
  z.object({ name: z.literal("slot-selected"), type: bookingType }),
  z.object({
    name: z.literal("booking-failed"),
    type: bookingType,
    reason: z.literal("request_error"),
  }),
]) satisfies z.ZodMiniType<ClientBookingEvent>;

/** Run a report; a failure costs the report, never the request. */
async function reportSafely(report: () => Promise<void>): Promise<void> {
  try {
    await report();
  } catch (error) {
    console.error("[analytics] booking report failed", String(error));
  }
}

/** Report an event of this request to Umami once the response is sent. */
function reportAfterResponse(
  requestHeaders: Headers,
  type: BookingEventKey,
  name: string,
  data: Record<string, string | number>,
): void {
  const payload = eventPayload(requestHeaders, {
    name,
    data,
    fallbackUrl: BOOKING_PAGES[type],
  });
  if (payload) after(() => sendToUmami(payload));
}

/**
 * `POST /api/booking/event`: a funnel step the browser saw (`ClientBookingEvent`,
 * sent as a beacon). Public endpoint: anything outside the allowed events is
 * dropped. Always answers 204 - the browser does not read the answer.
 */
export async function handleBookingEventRequest(
  request: Request,
): Promise<Response> {
  const noContent = new Response(null, { status: 204 });
  if (!isAcceptedBeacon(request.headers)) return noContent;
  await reportSafely(async () => {
    const body = await request.text();
    if (body.length > MAX_EVENT_BODY_LENGTH) return;
    const parsed = clientBookingEventSchema.safeParse(parseQuietly(body));
    if (!parsed.success) return;
    const { name, ...data } = parsed.data;
    reportAfterResponse(request.headers, data.type, name, data);
  });
  return noContent;
}

/**
 * A beacon this site's own page sent: a declared, small body (`sendBeacon`
 * always declares its length, and the server holds a body to it, so no
 * oversized body is ever read), and no cross-site origin.
 */
function isAcceptedBeacon(headers: Headers): boolean {
  const length = Number(headers.get("content-length") ?? Number.NaN);
  if (!Number.isInteger(length) || length <= 0) return false;
  if (length > MAX_EVENT_BODY_LENGTH) return false;
  const site = headers.get("sec-fetch-site");
  return site === null || site === "same-origin";
}

/** The JSON value of a body, or `undefined` for anything that is no JSON. */
function parseQuietly(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

/**
 * Report the outcome of one booking attempt: `booking-confirmed` with type and
 * duration, or `booking-failed` with type and reason. Takes the raw submission:
 * an attempt without an offered booking type is not reported. Never throws, so
 * the booking's own result is never at stake.
 */
export async function reportBookingOutcome(
  submission: unknown,
  result: SubmitResult,
): Promise<void> {
  await reportSafely(async () => {
    const { event, duration } = (submission ?? {}) as {
      event?: unknown;
      duration?: unknown;
    };
    const parsedType = bookingType.safeParse(event);
    if (!parsedType.success) return;
    const type = parsedType.data;
    const requestHeaders = await headers();
    if (result.ok) {
      reportAfterResponse(requestHeaders, type, "booking-confirmed", {
        type,
        duration:
          typeof duration === "number"
            ? duration
            : bookingEvents[type].defaultDuration,
      });
    } else {
      reportAfterResponse(requestHeaders, type, "booking-failed", {
        type,
        reason: result.reason,
      });
    }
  });
}
