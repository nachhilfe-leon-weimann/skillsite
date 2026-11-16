import { withdrawalText } from "@/content/withdrawal";

/**
 * The withdrawal form is schema-driven like the booking: each field is
 * declared once here, and the form (rendering), the validation (`schema.ts`)
 * and the e-mails (`mail.ts`) read from that declaration.
 */

export type WithdrawalFieldKey = "name" | "email" | "contract" | "note";

/** How a field is cleaned and rendered: one line, or several. */
export type WithdrawalFieldKind = "text" | "email" | "textarea";

export type WithdrawalFieldDef = {
  key: WithdrawalFieldKey;
  kind: WithdrawalFieldKind;
  label: string;
  /** Muted suffix after the label, e.g. "(optional)". */
  hint?: string;
  placeholder?: string;
  /** Help line below the control. */
  description?: string;
  /** Shown below the control when the value is missing or invalid. */
  error: string;
  autoComplete?: string;
  /** Most characters after cleaning; the control enforces it as well. */
  maxLength: number;
  required: boolean;
};

const { fields } = withdrawalText;

/** The fields in form order. § 356a (2) BGB: name, contract, the address for the acknowledgement. */
export const withdrawalFields: readonly WithdrawalFieldDef[] = [
  {
    key: "name",
    kind: "text",
    ...fields.name,
    autoComplete: "name",
    maxLength: 100,
    required: true,
  },
  {
    key: "email",
    kind: "email",
    ...fields.email,
    autoComplete: "email",
    maxLength: 254,
    required: true,
  },
  {
    key: "contract",
    kind: "textarea",
    ...fields.contract,
    maxLength: 500,
    required: true,
  },
  {
    key: "note",
    kind: "textarea",
    ...fields.note,
    maxLength: 1000,
    required: false,
  },
];

/** The form's values, keyed by field. */
export type WithdrawalValues = Record<WithdrawalFieldKey, string>;

/** A validated, cleaned declaration: what both e-mails and the review show. */
export type WithdrawalDeclaration = WithdrawalValues;

export const emptyWithdrawalValues = (): WithdrawalValues => ({
  name: "",
  email: "",
  contract: "",
  note: "",
});

/** Anti-spam settings of the withdrawal action. */
export const WITHDRAWAL_ANTI_SPAM = {
  /** Least ms from the form's mount to the confirmation (time trap). */
  minFillMs: 3_000,
  rateLimit: {
    /** Per client address: a person withdraws once, perhaps twice. */
    perClient: { max: 5, windowMs: 60 * 60 * 1_000 },
    /**
     * All declarations about to be sent, together: bounds the mail a flood of
     * addresses can send. Junk requests (spam signals, invalid values) never
     * count against it.
     */
    overall: { max: 30, windowMs: 60 * 60 * 1_000 },
    /** Most client addresses tracked at once. */
    maxClients: 1_000,
  },
} as const;

/** What the form sends to the server action. */
export type WithdrawalSubmission = {
  values: WithdrawalValues;
  honeypot: string;
  /** Elapsed ms from the form's mount to the confirmation, on the client's clock. */
  fillDurationMs: number;
};

/** What the form holds until it sends: the mount time instead of a duration. */
export type WithdrawalDraft = Omit<WithdrawalSubmission, "fillDurationMs"> & {
  formLoadedAt: number;
};

/**
 * The action's answer. `sent` only once Microsoft Graph accepted the
 * acknowledgement (202). `not_sent`: nothing was sent (unconfigured, or the
 * request was refused). `unknown`: it may have been sent (timeout, unreadable
 * answer). The others turn the attempt down before anything is sent.
 */
export type WithdrawalResult =
  | {
      outcome: "sent";
      /** Date and time of receipt in Europe/Berlin, as the acknowledgement states it. */
      receivedAt: string;
    }
  | { outcome: "not_sent" }
  | { outcome: "unknown" }
  | {
      outcome: "rejected";
      reason: "rate_limited" | "blocked" | "too_fast" | "invalid";
      /** `invalid` only: the fields to correct. */
      fields?: WithdrawalFieldKey[];
    };
