import { BOOKING_TIMEZONE, CAL_SLOTS_TAG } from "@/lib/booking/config";

/**
 * The single point of Cal.com v2 I/O. Both availability (slots) and the booking
 * action go through here, so the endpoints, auth, API-version headers, timeouts
 * and error normalisation live in exactly one place.
 */

const SLOTS_URL = "https://api.cal.com/v2/slots";
const BOOKINGS_URL = "https://api.cal.com/v2/bookings";

const apiKey = () => process.env.CAL_API_KEY || null;

/** Raw Cal slots payload: ISO-date -> list of slot start instants. */
export type CalSlotsData = Record<string, Array<{ start?: string }>>;

/**
 * Fetch free slots for an event/month. Returns the raw Cal data map, or `null`
 * when Cal is unconfigured, unreachable or answered badly (the caller turns that
 * into the appropriate availability status).
 */
export async function fetchCalSlots(params: {
  eventTypeSlug: string;
  username: string;
  start: string;
  end: string;
  /** Only sent for variable-length events. */
  duration?: number;
}): Promise<CalSlotsData | null> {
  const key = apiKey();
  if (!key) return null;

  const url = new URL(SLOTS_URL);
  url.searchParams.set("eventTypeSlug", params.eventTypeSlug);
  url.searchParams.set("username", params.username);
  url.searchParams.set("start", params.start);
  url.searchParams.set("end", params.end);
  url.searchParams.set("timeZone", BOOKING_TIMEZONE);
  if (params.duration)
    url.searchParams.set("duration", String(params.duration));

  const controller = new AbortController();
  // Cal.com's slots endpoint is regularly slow; give it headroom before aborting.
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${key}`,
        "cal-api-version": "2024-09-04",
      },
      signal: controller.signal,
      next: { revalidate: 120, tags: [CAL_SLOTS_TAG] },
    });
    if (!res.ok) {
      console.error(`[booking] Cal.com slots request failed: ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { data?: CalSlotsData };
    if (!json.data) {
      console.error("[booking] Cal.com slots response had no `data` field");
      return null;
    }
    return json.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[booking] Cal.com slots request timed out");
    } else {
      console.error("[booking] Cal.com slots request errored", error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export type CreateBookingResult =
  /** `uid` is Cal.com's booking id, `null` if the response didn't carry one. */
  { ok: true; uid: string | null } | { ok: false; slotTaken: boolean };

/** Booking uid of a create response; recurring events answer with a list. */
function bookingUid(json: unknown): string | null {
  const data = (json as { data?: unknown } | null)?.data;
  const booking: unknown = Array.isArray(data) ? data[0] : data;
  const uid = (booking as { uid?: unknown } | null)?.uid;
  return typeof uid === "string" ? uid : null;
}

/**
 * Create a booking. `slotTaken` distinguishes a gone slot (send the user back to
 * pick another) from a generic failure (let them retry the same one) - Cal.com
 * has no stable machine code for it, so we detect it defensively.
 */
export async function createCalBooking(
  body: Record<string, unknown>,
): Promise<CreateBookingResult> {
  const key = apiKey();
  if (!key) {
    console.error("[booking] Cal.com is not configured - booking not created.");
    return { ok: false, slotTaken: false };
  }

  try {
    const res = await fetch(BOOKINGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[booking] Cal.com booking failed: ${res.status} ${detail}`,
      );
      const slotTaken =
        res.status === 409 ||
        /no longer available|not available|already booked|fully booked|no available|seats[_ ]?full|slot.*(taken|unavailable)/i.test(
          detail,
        );
      return { ok: false, slotTaken };
    }
    const uid = bookingUid(await res.json().catch(() => null));
    if (!uid) {
      console.warn(
        "[booking] Cal.com accepted the booking but the response had no uid",
      );
    }
    return { ok: true, uid };
  } catch (error) {
    console.error("[booking] Cal.com booking request errored", error);
    return { ok: false, slotTaken: false };
  }
}
