"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DayPicker,
  TZDate,
  useDayPicker,
  type CaptionLabelProps,
  type CustomComponents,
  type DayButtonProps,
  type DayProps,
  type MonthCaptionProps,
  type MonthGridProps,
  type RootProps,
  type WeekProps,
  type WeekdayProps,
  type WeekdaysProps,
  type WeeksProps,
} from "react-day-picker";
import { de } from "react-day-picker/locale";

import { IconButton } from "../primitives/icon-button";
import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Calendar: a month grid on React DayPicker for picking one day, built from
 * the brand tokens (no DayPicker stylesheet).
 *
 * Dates are calendar dates, never instants: days are "YYYY-MM-DD" and months
 * "YYYY-MM" in `timeZone`. They become DayPicker dates through its documented
 * time-zone support (`TZDate` and the `timeZone` prop) and come back through
 * the same zone, so a day never shifts with the viewer's own time zone.
 *
 * The parent owns the month: every month change - the previous/next buttons
 * and the keys that leave the month - asks `onMonthChange`, and the grid shows
 * only the `month` it is given. Days `isSelectable` rejects, and every day while
 * `busy`, stay in the keyboard's roving focus with `aria-disabled`; Enter or
 * Space on them selects nothing, and the pointer passes through them to their
 * cell, as through the disabled days of the old calendar. Keys follow DayPicker: arrows move a
 * day or a week, Home/End to the start/end of the week, PageUp/PageDown a
 * month, Shift+PageUp/PageDown a year, all within `startMonth`..`endMonth`.
 * ------------------------------------------------------------------------- */

const locales = { "de-DE": de } as const;

/** The locales the calendar has month, weekday and day labels for. */
export type CalendarLocale = keyof typeof locales;

type CalendarProps = {
  /** The month shown, "YYYY-MM". */
  month: string;
  /** Asked for every month change, with the requested month ("YYYY-MM"). */
  onMonthChange: (month: string) => void;
  /** The first and last month the calendar may show, "YYYY-MM". */
  startMonth: string;
  endMonth: string;
  /** The selected day, "YYYY-MM-DD", or `null`. */
  selected: string | null;
  /** Called with a selectable day ("YYYY-MM-DD") the user picked. */
  onSelect: (date: string) => void;
  /** Whether a day ("YYYY-MM-DD") may be picked. */
  isSelectable: (date: string) => boolean;
  /** Today, "YYYY-MM-DD", in `timeZone`; it gets a dot. */
  today: string;
  /** While true no day is selectable and the days pulse. */
  busy?: boolean;
  /** The IANA time zone the dates belong to. */
  timeZone: string;
  locale: CalendarLocale;
  /** 0 = Sunday ... 6 = Saturday. */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Names of the month buttons. */
  previousMonthLabel: string;
  nextMonthLabel: string;
  className?: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** "YYYY-MM-DD" or "YYYY-MM" -> its numbers; a missing day is the 1st. */
function parseDateKey(key: string) {
  const [year = NaN, month = NaN, day = 1] = key.split("-").map(Number);
  return { year, month, day };
}

/** A calendar date in `timeZone` as a DayPicker date: noon of that day there. */
function toZonedDate(key: string, timeZone: string) {
  const { year, month, day } = parseDateKey(key);
  return new TZDate(year, month - 1, day, 12, timeZone);
}

/** The month ("YYYY-MM") a DayPicker date falls in, in `timeZone`. */
function toMonthKey(date: Date, timeZone: string) {
  const zoned = new TZDate(date, timeZone);
  return `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}`;
}

/** The calendar date ("YYYY-MM-DD") a DayPicker date falls on in `timeZone`. */
function toDateKey(date: Date, timeZone: string) {
  const zoned = new TZDate(date, timeZone);
  return `${toMonthKey(zoned, timeZone)}-${pad(zoned.getDate())}`;
}

type CalendarState = { month: string; busy: boolean; className?: string };

const CalendarContext = createContext<CalendarState>({
  month: "",
  busy: false,
});

/* DayPicker's parts, rendered as divs with grid roles and the brand classes.
   They forward what DayPicker hands them (roles, labels, tabIndex, handlers,
   data attributes) and drop only its `rdp-*` class names and the objects it
   describes a part with (`day`, `week`, `modifiers`, ...). */

/** `props` without `keys`. */
function omit<T extends object, K extends keyof T>(props: T, ...keys: K[]) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !keys.includes(key as K)),
  ) as Omit<T, K>;
}

/** The calendar's root; DayPicker hands it a `rootRef` only for its animations, which are off. */
function Root(props: RootProps) {
  const { className } = useContext(CalendarContext);
  return <div {...omit(props, "rootRef", "className")} className={className} />;
}

function MonthCaption(props: MonthCaptionProps) {
  const { previousMonth, nextMonth, goToMonth, labels } = useDayPicker();
  return (
    <div
      {...omit(props, "calendarMonth", "displayIndex", "className", "children")}
      className="mb-4 flex"
    >
      <div className="m-auto">{props.children}</div>
      <div className="flex flex-row gap-3">
        <IconButton
          size="sm"
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
          aria-label={labels.labelPrevious(previousMonth)}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </IconButton>
        <IconButton
          size="sm"
          onClick={() => nextMonth && goToMonth(nextMonth)}
          disabled={!nextMonth}
          aria-label={labels.labelNext(nextMonth)}
        >
          <ChevronRight className="size-4" aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}

/**
 * The month caption, "November 2026": plain text, not DayPicker's live region
 * (the grid's name and the focused day's label carry the month). Month and
 * year are separate text runs, as the booking calendar rendered them before:
 * one run shapes a few thousandths of a pixel narrower and moves the centred
 * caption's antialiasing.
 */
function CaptionLabel(props: CaptionLabelProps) {
  const caption = String(props.children);
  const space = caption.lastIndexOf(" ");
  return (
    <strong
      {...omit(props, "className", "children", "role", "aria-live")}
      className="font-heading text-month text-ink"
    >
      {space > 0 ? (
        <>
          {caption.slice(0, space)} {caption.slice(space + 1)}
        </>
      ) : (
        caption
      )}
    </strong>
  );
}

function MonthGrid(props: MonthGridProps) {
  const { busy } = useContext(CalendarContext);
  return (
    <div
      {...(omit(props, "className") as ComponentProps<"div">)}
      aria-busy={busy}
    />
  );
}

/** The weekday names: short on screen, the full name for assistive technology. */
function Weekdays(props: WeekdaysProps) {
  return (
    <div
      role="row"
      {...(omit(props, "className") as ComponentProps<"div">)}
      className="mb-2 grid grid-cols-7 gap-1.5"
    />
  );
}

function Weekday(props: WeekdayProps) {
  return (
    <div
      role="columnheader"
      {...(omit(props, "className", "scope") as ComponentProps<"div">)}
      className="text-center text-caption font-semibold text-ink-soft"
    />
  );
}

/** A new month's days fade in; loading and selecting keep them in place. */
function Weeks(props: WeeksProps) {
  const { month } = useContext(CalendarContext);
  return (
    <div
      key={month}
      role="rowgroup"
      {...(omit(props, "className") as ComponentProps<"div">)}
      className="flex flex-col gap-1.5 motion-safe:animate-fade"
    />
  );
}

function Week(props: WeekProps) {
  return (
    <div
      role="row"
      {...(omit(props, "week", "className") as ComponentProps<"div">)}
      className="grid grid-cols-7 gap-1.5"
    />
  );
}

function Day(props: DayProps) {
  return <div {...omit(props, "day", "modifiers", "className")} />;
}

function DayButton(props: DayButtonProps) {
  const { modifiers, children } = props;
  // DayPicker's roving focus: the focused day takes DOM focus, also when it
  // mounts with a new month.
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const selected = Boolean(modifiers.selected);
  const available = !modifiers.unavailable;
  return (
    <button
      ref={ref}
      {...omit(props, "day", "modifiers", "className", "children")}
      aria-disabled={!available || undefined}
      className={cn(
        "relative flex aspect-square w-full items-center justify-center rounded-lg border text-small transition-colors",
        selected && "border-coral bg-coral font-bold text-white",
        !selected &&
          available &&
          "border-accent-tint-45 bg-accent-tint-11 font-semibold text-coral hover:bg-coral hover:text-white",
        !available &&
          "border-line bg-bg text-ink-soft/50 aria-disabled:pointer-events-none",
        modifiers.busy && "animate-pulse",
      )}
    >
      {children}
      {modifiers.today ? (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full",
            selected ? "bg-white" : "bg-coral",
          )}
        />
      ) : null}
    </button>
  );
}

const components: Partial<CustomComponents> = {
  Root,
  MonthCaption,
  CaptionLabel,
  MonthGrid,
  Weekdays,
  Weekday,
  Weeks,
  Week,
  Day,
  DayButton,
};

export function Calendar({
  month,
  onMonthChange,
  startMonth,
  endMonth,
  selected,
  onSelect,
  isSelectable,
  today,
  busy = false,
  timeZone,
  locale,
  weekStartsOn,
  previousMonthLabel,
  nextMonthLabel,
  className,
}: CalendarProps) {
  const dates = useMemo(
    () => ({
      month: toZonedDate(month, timeZone),
      startMonth: toZonedDate(startMonth, timeZone),
      endMonth: toZonedDate(endMonth, timeZone),
      today: toZonedDate(today, timeZone),
      selected: selected ? toZonedDate(selected, timeZone) : undefined,
    }),
    [month, startMonth, endMonth, today, selected, timeZone],
  );
  const labels = useMemo(
    () => ({
      labelPrevious: () => previousMonthLabel,
      labelNext: () => nextMonthLabel,
    }),
    [previousMonthLabel, nextMonthLabel],
  );
  const isUnavailable = (date: Date) =>
    busy || !isSelectable(toDateKey(date, timeZone));
  const state = useMemo(
    () => ({ month, busy, className }),
    [month, busy, className],
  );

  return (
    <CalendarContext.Provider value={state}>
      <DayPicker
        mode="single"
        required
        timeZone={timeZone}
        locale={locales[locale]}
        weekStartsOn={weekStartsOn}
        month={dates.month}
        startMonth={dates.startMonth}
        endMonth={dates.endMonth}
        today={dates.today}
        selected={dates.selected}
        onMonthChange={(next) => onMonthChange(toMonthKey(next, timeZone))}
        // A click, Enter or Space on an unavailable day selects nothing.
        onSelect={(_, day) => {
          const key = toDateKey(day, timeZone);
          if (!busy && isSelectable(key)) onSelect(key);
        }}
        modifiers={{ unavailable: isUnavailable, busy }}
        hideNavigation
        labels={labels}
        components={components}
      />
    </CalendarContext.Provider>
  );
}
