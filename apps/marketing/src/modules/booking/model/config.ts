import { bookerText } from "@/content/booking";
import { subjects } from "@/content/subjects";
import type { FieldDef, FieldOption, FieldValue } from "./fields";

export const BOOKING_TIMEZONE = "Europe/Berlin";

/** Cache tag for the Cal.com slots fetch - revalidated after every booking. */
export const CAL_SLOTS_TAG = "cal-slots";

export const calUsername = "nachhilfe-leonweimann";

export type BookingEventKey = "kennenlernen" | "nachhilfe";
export type BookingDuration = 45 | 60 | 90;

/** Upper bounds so oversized input never reaches Cal.com. */
export const FIELD_LIMITS = {
  name: 80,
  email: 254,
  phone: 32,
  note: 1000,
} as const;

/** Anti-spam thresholds for the public booking. Tune here only. */
export const ANTI_SPAM = {
  /** Min ms between form mount and submit (time-trap). */
  minFillMs: 3_000,
  /** Rate-limit windows per client IP. */
  rateLimit: {
    short: { max: 4, windowMs: 10 * 60 * 1_000 },
    daily: { max: 15, windowMs: 24 * 60 * 60 * 1_000 },
    /**
     * Most client addresses tracked at once - bounds the memory a flood of
     * addresses can take. Past it, the address whose last recorded attempt
     * is the oldest goes.
     */
    maxClients: 10_000,
  },
} as const;

/** Subject choices, derived from the offered subjects so they stay in sync. */
const subjectOptions: FieldOption[] = subjects.map((subject) => ({
  value: subject.name,
  label: subject.name,
  icon: subject.glyph,
}));

export type BookingEventConfig = {
  calEventSlug: string;
  /** Selectable tutoring durations; `null` means a fixed-length event. */
  durations: BookingDuration[] | null;
  /** Minutes - the fixed length or the default selected duration. */
  defaultDuration: number;
  /** How the session happens. */
  medium: "phone" | "online";
  mediumLabel: string;
  /** € per hour, scaled linearly by the selected duration; null when free. */
  pricePerHour: number | null;
  /** Price shown in the booking sidebar. */
  priceLabel: string;
  /** Submit-button label for this event's form. */
  submitLabel: string;
  /** Reassurance line shown under the button once the form is complete. */
  formNote?: string;
  /** Schema-driven form fields; render, validation and Cal mapping read these. */
  fields: FieldDef[];
};

/** Name + e-mail are shared by every event. */
const nameFields: FieldDef[] = [
  {
    key: "firstName",
    kind: "text",
    label: "Vorname",
    placeholder: "Max",
    half: true,
    autoComplete: "given-name",
    maxLength: FIELD_LIMITS.name,
    required: true,
    target: { to: "attendeeName", part: "first" },
  },
  {
    key: "lastName",
    kind: "text",
    label: "Nachname",
    placeholder: "Mustermann",
    half: true,
    autoComplete: "family-name",
    maxLength: FIELD_LIMITS.name,
    required: true,
    target: { to: "attendeeName", part: "last" },
  },
];

// `half` so it pairs with a neighbouring half field (e.g. phone in the
// first-meeting form); standing alone it simply renders full-width.
const emailField: FieldDef = {
  key: "email",
  kind: "email",
  label: "E-Mail",
  placeholder: "du@beispiel.de",
  half: true,
  autoComplete: "email",
  maxLength: FIELD_LIMITS.email,
  required: true,
  format: "email",
  target: { to: "attendee", field: "email" },
};

/**
 * Who books a paid lesson, as the booking's metadata records it: a parent for
 * their child, an adult student, or a minor student with their parents'
 * consent.
 */
export type BookingParty = keyof typeof bookerText.form.bookingParty.options;

const bookingPartyText = bookerText.form.bookingParty;

/** Asked first, so the name and e-mail that follow are clearly the booker's. */
const bookingPartyField: FieldDef = {
  key: "bookingParty",
  kind: "radio",
  label: bookingPartyText.label,
  shortLabel: bookingPartyText.shortLabel,
  required: true,
  // No default: the booker chooses actively.
  options: (
    Object.entries(bookingPartyText.options) as [BookingParty, string][]
  ).map(([value, label]) => ({ value, label })),
  target: { to: "metadata", key: "bookingParty" },
};

const noteField = (label: string): FieldDef => ({
  key: "note",
  kind: "textarea",
  label,
  hint: "(freiwillig)",
  placeholder: "Klassenstufe, Thema, Ziel …",
  maxLength: FIELD_LIMITS.note,
  target: { to: "bookingField", slug: "notes" },
});

export const bookingEvents: Record<BookingEventKey, BookingEventConfig> = {
  kennenlernen: {
    calEventSlug: "kennenlernen",
    durations: null,
    defaultDuration: 15,
    medium: "phone",
    mediumLabel: "Telefonisches Erstgespräch",
    pricePerHour: null,
    priceLabel: "Kostenlos und unverbindlich",
    submitLabel: "Erstgespräch buchen",
    formNote: "Ich rufe dich zum gewählten Termin an.",
    fields: [
      ...nameFields,
      emailField,
      {
        key: "phone",
        kind: "tel",
        label: "Telefonnummer",
        placeholder: "+49 …",
        half: true,
        autoComplete: "tel",
        maxLength: FIELD_LIMITS.phone,
        required: true,
        format: "phone",
        target: { to: "attendee", field: "phoneNumber" },
      },
      {
        key: "subjects",
        kind: "chips",
        label: "Fächer",
        multiple: true,
        required: true,
        options: subjectOptions,
        target: { to: "bookingField", slug: "subjects" },
      },
      noteField("Worum geht’s?"),
    ],
  },
  nachhilfe: {
    calEventSlug: "nachhilfe-online",
    durations: [45, 60, 90],
    defaultDuration: 60,
    medium: "online",
    mediumLabel: "Online über Discord oder Microsoft Teams",
    pricePerHour: 30,
    priceLabel: "30 € pro 60 Minuten",
    submitLabel: "Zahlungspflichtig buchen",
    formNote:
      "Online über Discord oder Microsoft Teams. Bis 24 Stunden vorher kostenfrei verschiebbar oder stornierbar.",
    fields: [
      bookingPartyField,
      ...nameFields,
      emailField,
      {
        key: "location",
        kind: "radio",
        label: "Plattform",
        required: true,
        defaultValue: "office365-video",
        options: [
          { value: "office365-video", label: "Microsoft Teams" },
          { value: "discord-video", label: "Discord" },
        ],
        target: { to: "location" },
      },
      {
        key: "subject",
        kind: "chips",
        label: "In welchem Fach kann ich dir helfen?",
        shortLabel: "Fach",
        multiple: false,
        required: true,
        inSummary: true,
        options: subjectOptions,
        target: { to: "bookingField", slug: "subject" },
      },
      noteField("Zusätzliche Notizen"),
    ],
  },
};

/** A single bookable slot - `time` for display (Berlin "HH:mm"), `start` the ISO instant. */
export type BookingSlot = {
  time: string;
  start: string;
};

export type DayAvailability = {
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  slots: BookingSlot[];
};

/**
 * - `ok`: Cal.com answered. `days` reflects exactly what is bookable (possibly empty).
 * - `unconfigured`: no Cal credentials - nothing is served (and it's logged).
 * - `error`: Cal.com could not be reached / answered badly.
 */
export type AvailabilityStatus = "ok" | "unconfigured" | "error";

export type AvailabilityResponse = {
  status: AvailabilityStatus;
  timeZone: string;
  days: DayAvailability[];
};

/** A validated booking request handed from the form to the server action. */
export type BookingSubmission = {
  event: BookingEventKey;
  /** Selected slot - the exact Cal.com ISO start instant. */
  slot: string;
  /** Selected duration in minutes (variable-length events only). */
  duration?: number;
  /** Field values keyed by `FieldDef.key`. */
  values: Record<string, FieldValue>;
  /** Explicit legal confirmations required for a paid lesson booking. */
  agreements?: {
    termsAccepted: boolean;
    earlyPerformanceRequested: boolean;
  };
  /** Anti-spam honeypot - bots fill it, humans never see it. */
  honeypot?: string;
  /**
   * Anti-spam time-trap: ms between form mount and this send, measured on the
   * client's own clock. A duration on purpose - a client timestamp compared with
   * the server clock fails for every device whose clock is off.
   */
  fillDurationMs?: number;
};

/**
 * What the form hands to the booker. Stays on the client and becomes a
 * `BookingSubmission` at send time (see `withFillDuration`).
 */
export type BookingDraft = Omit<BookingSubmission, "fillDurationMs"> & {
  /** `performance.now()` at form mount. */
  formLoadedAt: number;
};

export type SubmitFailureReason =
  | "validation"
  | "slot_taken"
  | "rate_limited"
  /** Stopped by an anti-spam layer; retrying can't help, contacting can. */
  | "blocked"
  /** Tripped the anti-spam time-trap; the retry re-measures and passes. */
  | "too_fast"
  | "generic";

/** `ok: true` means Cal.com confirmed the booking - never reported otherwise. */
export type SubmitResult =
  { ok: true } | { ok: false; error: string; reason: SubmitFailureReason };
