"use client";

import { useState } from "react";

import { withFillDuration } from "@/lib/anti-spam";
import {
  emptyWithdrawalValues,
  type WithdrawalDeclaration,
  type WithdrawalFieldKey,
  type WithdrawalResult,
  type WithdrawalValues,
} from "../model/config";
import { checkWithdrawalValues } from "../model/schema";
import { submitWithdrawal } from "../server/actions";

/**
 * The steps of § 356a BGB: enter the details ("Vertrag widerrufen"), review
 * and confirm them ("Widerruf bestätigen"), then the outcome. The declaration
 * reviewed is the cleaned one the server will send.
 */
export type WithdrawalStep =
  | { kind: "edit" }
  | { kind: "review"; declaration: WithdrawalDeclaration }
  | { kind: "sending"; declaration: WithdrawalDeclaration }
  | {
      kind: "done";
      declaration: WithdrawalDeclaration;
      result: WithdrawalResult;
    };

/** Form state, validation and the send of a withdrawal. */
export function useWithdrawal() {
  const [values, setValues] = useState<WithdrawalValues>(emptyWithdrawalValues);
  const [honeypot, setHoneypot] = useState("");
  // Mount time on the monotonic clock; the send turns it into the elapsed
  // fill time the server's time trap checks.
  const [formLoadedAt] = useState(() => performance.now());
  // Errors show only once the visitor tried to go on, then follow the input.
  const [attempted, setAttempted] = useState(false);
  const [step, setStep] = useState<WithdrawalStep>({ kind: "edit" });

  const check = checkWithdrawalValues(values);
  const invalidFields: WithdrawalFieldKey[] =
    attempted && !check.ok ? check.fields : [];

  const setValue = (key: WithdrawalFieldKey, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  /** "Vertrag widerrufen": on to the review, or the invalid fields. */
  const review = (): WithdrawalFieldKey[] => {
    setAttempted(true);
    if (!check.ok) return check.fields;
    setStep({ kind: "review", declaration: check.declaration });
    return [];
  };

  const edit = () => setStep({ kind: "edit" });

  /** "Widerruf bestätigen": send the reviewed declaration. */
  const confirm = async () => {
    if (step.kind !== "review" && step.kind !== "done") return;
    const { declaration } = step;
    setStep({ kind: "sending", declaration });
    let result: WithdrawalResult;
    try {
      // Measured per send, so a retry carries the time up to the retry.
      result = await submitWithdrawal(
        withFillDuration(
          { values: declaration, honeypot, formLoadedAt },
          performance.now(),
        ),
      );
    } catch {
      // The request broke (offline, stale deployment): the server may or may
      // not have sent the acknowledgement.
      result = { outcome: "unknown" };
    }
    setStep({ kind: "done", declaration, result });
    if (result.outcome === "rejected" && result.reason === "invalid") {
      setAttempted(true);
    }
  };

  return {
    values,
    setValue,
    honeypot,
    setHoneypot,
    invalidFields,
    step,
    review,
    edit,
    confirm,
  };
}
