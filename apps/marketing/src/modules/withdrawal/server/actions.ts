"use server";

import { detectSpamSignal } from "@/lib/anti-spam";
import { clientIp } from "@/lib/client-ip";
import { withdrawalMailConfig } from "@/lib/env";

import {
  WITHDRAWAL_ANTI_SPAM,
  type WithdrawalResult,
  type WithdrawalSubmission,
} from "../model/config";
import {
  acknowledgementMail,
  formatReceivedAt,
  noticeMail,
} from "../model/mail";
import { checkWithdrawalValues } from "../model/schema";
import { requestToken, sendMail } from "./graph-mail";
import { describeAttempt, logWithdrawal } from "./log";
import { checkClientLimit, checkOverallLimit } from "./rate-limit";

/**
 * Submit a withdrawal declaration (§ 356a BGB): send the acknowledgement to the
 * consumer and a notice to the withdrawal mailbox through Microsoft Graph.
 * Public endpoint, so it re-runs the full validation.
 *
 * Two guarantees hold on every path: `sent` is reported only once Graph
 * accepted the acknowledgement (202), and each attempt leaves one outcome line
 * in the log. An anti-spam hit is a visible refusal, never a feigned success.
 */
export async function submitWithdrawal(
  submission: WithdrawalSubmission,
): Promise<WithdrawalResult> {
  const attempt = describeAttempt(submission);
  try {
    return await processWithdrawal(submission, attempt);
  } catch (error) {
    // A bug: whether a mail went out is unproven, so the consumer hears
    // "unknown". The log keeps the error's name only - its message may echo input.
    logWithdrawal("unknown", {
      ...attempt,
      error: error instanceof Error ? error.name : typeof error,
    });
    return { outcome: "unknown" };
  }
}

/**
 * Client limit -> anti-spam -> validation -> overall limit -> configuration ->
 * token -> acknowledgement -> notice.
 */
async function processWithdrawal(
  submission: WithdrawalSubmission,
  attempt: Record<string, unknown>,
): Promise<WithdrawalResult> {
  // Per address first: it counts every attempt, the blocked ones included.
  if (!checkClientLimit(await clientIp()).ok) {
    logWithdrawal("rate_limited", attempt);
    return { outcome: "rejected", reason: "rate_limited" };
  }

  const signal = detectSpamSignal(submission, WITHDRAWAL_ANTI_SPAM);
  if (signal) {
    logWithdrawal("blocked", { ...attempt, signal });
    return {
      outcome: "rejected",
      reason: signal === "too_fast" ? "too_fast" : "blocked",
    };
  }

  const checked = checkWithdrawalValues(
    typeof submission === "object" && submission !== null
      ? submission.values
      : undefined,
  );
  if (!checked.ok) {
    logWithdrawal("rejected", { ...attempt, fields: checked.fields });
    return { outcome: "rejected", reason: "invalid", fields: checked.fields };
  }
  const { declaration } = checked;

  // Over all addresses last: only declarations that would be sent count, so
  // junk requests cannot use the budget up for real consumers.
  if (!checkOverallLimit().ok) {
    logWithdrawal("unavailable", attempt);
    return { outcome: "rejected", reason: "rate_limited" };
  }

  // The receipt is the server's clock at the confirmation, in German time.
  const receivedAt = formatReceivedAt(new Date());

  const config = withdrawalMailConfig();
  if (!config) {
    logWithdrawal("unconfigured", attempt);
    return { outcome: "not_sent" };
  }

  const token = await requestToken(config);
  if (!token.ok) {
    logWithdrawal("failed", { ...attempt, graph: token.failure });
    return { outcome: "not_sent" };
  }

  const acknowledgement = await sendMail(
    config,
    token.token,
    "acknowledgement",
    declaration.email,
    acknowledgementMail(declaration, receivedAt),
  );

  // The notice follows every acknowledgement, a refused one included: the
  // provider then holds the declaration and can acknowledge it by hand.
  const notice = await sendMail(
    config,
    token.token,
    "notice",
    config.mailbox,
    noticeMail(declaration, receivedAt, acknowledgement.state),
  );
  const noticeLog =
    notice.state === "sent"
      ? { notice: "sent" }
      : { notice: notice.state, noticeGraph: notice.failure };

  switch (acknowledgement.state) {
    case "refused":
      logWithdrawal("failed", {
        ...attempt,
        graph: acknowledgement.failure,
        ...noticeLog,
      });
      return { outcome: "not_sent" };
    case "unknown":
      logWithdrawal("unknown", {
        ...attempt,
        graph: acknowledgement.failure,
        ...noticeLog,
      });
      return { outcome: "unknown" };
    case "sent":
      logWithdrawal(notice.state === "sent" ? "sent" : "sent_without_notice", {
        ...attempt,
        ...noticeLog,
      });
      return { outcome: "sent", receivedAt };
  }
}
