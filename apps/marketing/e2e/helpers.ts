import type { Page, Route } from "@playwright/test";

/** Answer every non-local request locally: the smoke test must not depend on the network (e.g. Umami). */
export async function isolate(page: Page) {
  await page.context().route(
    // Anchored at the host end (`(?::\d+)?\/`) so `localhost.example.com` isn't
    // mistaken for `localhost` and left unstubbed.
    /^https?:\/\/(?!(?:127\.0\.0\.1|localhost)(?::\d+)?\/)/,
    (route) => route.fulfill({ status: 204, body: "" }),
  );
}

/** Collect console errors and uncaught exceptions of a page. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

/**
 * Freeze the page's clock at `instant`: `Date.now()` and `new Date()` without
 * arguments return it; timers keep running. Unlike `page.clock`, whose `Date`
 * replacement drops the prototype of `Date` subclasses (`TZDate`, which the
 * calendar's time-zone support rests on, then falls back to the host zone),
 * this keeps subclasses intact.
 */
export async function freezeTime(page: Page, instant: Date) {
  await page.addInitScript((time) => {
    const NativeDate = Date;
    globalThis.Date = new Proxy(NativeDate, {
      construct: (target, args, newTarget) =>
        Reflect.construct(target, args.length ? args : [time], newTarget),
      apply: () => new NativeDate(time).toString(),
      get: (target, key, receiver) =>
        key === "now" ? () => time : Reflect.get(target, key, receiver),
    });
  }, instant.getTime());
}

/**
 * The UTC offset Europe/Berlin has at a wall-clock date and time there: "+01:00"
 * in winter, "+02:00" in summer. Slot starts are Berlin instants; a fixed offset
 * would move a winter slot by an hour.
 */
export function berlinOffset(date: string, time: string) {
  for (const offset of ["+01:00", "+02:00"]) {
    const wall = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(new Date(`${date}T${time}:00${offset}`))
      .replace(", ", "T");
    if (wall === `${date}T${time}`) return offset;
  }
  throw new Error(`${date} ${time} does not exist in Berlin`);
}

/** A free slot at a Berlin wall-clock time, as the availability API sends it. */
export const berlinSlot = (date: string, time = "10:00") => ({
  time,
  start: `${date}T${time}:00.000${berlinOffset(date, time)}`,
});

/** Stub the availability API: one bookable slot at 10:00 on the last day of whichever month is requested. */
export async function stubAvailability(page: Page) {
  await page.route(/\/api\/booking\/availability\?/, (route) => {
    const url = new URL(route.request().url());
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const date = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return route.fulfill({
      json: {
        status: "ok",
        timeZone: "Europe/Berlin",
        days: [{ date, slots: [berlinSlot(date)] }],
      },
    });
  });
}

/** A month's answer: its free days ("YYYY-MM-DD"), or a failed or unconfigured service. */
export type MonthAnswer = readonly string[] | "error" | "unconfigured";

/**
 * Stub the availability API per month ("YYYY-MM"): each free day gets a slot at
 * 10:00 Berlin time; a month not listed has no free day. `requests` logs every
 * request as "YYYY-MM@duration". `hold` keeps a month's answers back until
 * `release`; `answers` may change between requests.
 */
export async function stubMonths(
  page: Page,
  answers: Record<string, MonthAnswer>,
) {
  const requests: string[] = [];
  const holding = new Set<string>();
  const held: { month: string; route: Route }[] = [];
  const answer = (route: Route, month: string) => {
    const days = answers[month] ?? [];
    if (days === "error") return route.fulfill({ status: 500, body: "" });
    return route.fulfill({
      json: {
        status: days === "unconfigured" ? "unconfigured" : "ok",
        timeZone: "Europe/Berlin",
        days:
          days === "unconfigured"
            ? []
            : days.map((date) => ({ date, slots: [berlinSlot(date)] })),
      },
    });
  };
  await page.route(/\/api\/booking\/availability\?/, (route) => {
    const url = new URL(route.request().url());
    const month = `${url.searchParams.get("year")}-${url.searchParams.get("month")!.padStart(2, "0")}`;
    requests.push(`${month}@${url.searchParams.get("duration")}`);
    if (holding.has(month)) {
      held.push({ month, route });
      return;
    }
    return answer(route, month);
  });
  return {
    answers,
    requests,
    hold: (month: string) => holding.add(month),
    /** Answer the held requests of `month`; an aborted one is skipped. */
    async release(month: string) {
      holding.delete(month);
      for (const { route } of held.filter((item) => item.month === month))
        await answer(route, month).catch(() => {});
    },
  };
}
