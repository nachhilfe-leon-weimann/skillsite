import { legalContact } from "@/content/legal-contact";
import { withdrawalMail, withdrawalText } from "@/content/withdrawal";

import type { WithdrawalDeclaration } from "./config";
import { singleLine } from "./text";

/**
 * The two plain-text e-mails of a withdrawal (§ 356a (4) BGB): the
 * acknowledgement to the consumer and the notice to the provider's mailbox.
 * Both carry the full declaration and the date and time of its receipt. Pure:
 * the server action passes the receipt instant from its own clock.
 */

/** The time zone of the date and time of receipt. */
export const RECEIPT_TIME_ZONE = "Europe/Berlin";

const receiptFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: RECEIPT_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
});

/** `16.11.2026, 21:41:05 MEZ`: the instant of receipt in German time. */
export function formatReceivedAt(instant: Date): string {
  return receiptFormat.format(instant);
}

export type WithdrawalMessage = {
  subject: string;
  /** Plain text. */
  body: string;
};

const { declaration: labels } = withdrawalText;

/** The declaration's content, as the review showed it. */
export function declarationLines(declaration: WithdrawalDeclaration): string[] {
  return [
    labels.statement,
    "",
    `${labels.name}: ${declaration.name}`,
    `${labels.email}: ${declaration.email}`,
    `${labels.contract}:`,
    declaration.contract,
    "",
    `${labels.note}:`,
    declaration.note || labels.noNote,
  ];
}

const providerLines = [
  legalContact.businessName,
  legalContact.ownerName,
  legalContact.street,
  legalContact.city,
  legalContact.country,
  `${withdrawalMail.providerEmail}: ${legalContact.email}`,
];

/** Content and receipt, shared by both e-mails. */
function record(declaration: WithdrawalDeclaration, receivedAt: string) {
  return [
    `${withdrawalMail.receivedAt}: ${receivedAt}`,
    "",
    `${withdrawalMail.content}:`,
    "",
    ...declarationLines(declaration),
  ];
}

/** The acknowledgement to the consumer, on a durable medium. */
export function acknowledgementMail(
  declaration: WithdrawalDeclaration,
  receivedAt: string,
): WithdrawalMessage {
  const text = withdrawalMail.acknowledgement;
  return {
    subject: text.subject,
    body: [
      text.greeting,
      "",
      text.intro,
      "",
      ...record(declaration, receivedAt),
      "",
      text.closing,
      "",
      ...providerLines,
    ].join("\n"),
  };
}

/**
 * The notice to the provider's mailbox. `acknowledgement` says whether Graph
 * accepted the acknowledgement, left it unknown or refused it - then the
 * provider must acknowledge by hand.
 */
export function noticeMail(
  declaration: WithdrawalDeclaration,
  receivedAt: string,
  acknowledgement: "sent" | "unknown" | "refused",
): WithdrawalMessage {
  const text = withdrawalMail.notice;
  return {
    // The name is one line already; cleaned again, as a subject must never break.
    subject: singleLine(text.subject(declaration.name)),
    body: [
      text.intro,
      text.acknowledgement[acknowledgement],
      "",
      ...record(declaration, receivedAt),
    ].join("\n"),
  };
}
