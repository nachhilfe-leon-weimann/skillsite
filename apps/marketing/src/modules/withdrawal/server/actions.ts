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
import { checkWithdrawalRateLimit } from "./rate-limit";

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

/** Rate limit -> anti-spam -> validation -> configuration -> token -> mails. */
async function processWithdrawal(
  submission: WithdrawalSubmission,
  attempt: Record<string, unknown>,
): Promise<WithdrawalResult> {
  const limit = checkWithdrawalRateLimit(await clientIp());
  if (!limit.ok) {
    logWithdrawal("rate_limited", { ...attempt, scope: limit.scope });
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
  if (acknowledgement.state === "refused") {
    logWithdrawal("failed", { ...attempt, graph: acknowledgement.failure });
    return { outcome: "not_sent" };
  }

  // The notice follows a sent and an unknown acknowledgement alike: then the
  // provider learns of the withdrawal and can acknowledge it by hand.
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
      : { notice: notice.state, graph: notice.failure };

  if (acknowledgement.state === "unknown") {
    logWithdrawal("unknown", {
      ...attempt,
      acknowledgement: acknowledgement.failure,
      ...noticeLog,
    });
    return { outcome: "unknown" };
  }

  logWithdrawal(notice.state === "sent" ? "sent" : "sent_without_notice", {
    ...attempt,
    ...noticeLog,
  });
  return { outcome: "sent", receivedAt };
}
