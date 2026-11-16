"use client";

import { useEffect, useRef } from "react";

import { Card } from "@skillsite/ui/primitives/card";

import { useWithdrawal } from "./use-withdrawal";
import { WithdrawalEdit } from "./withdrawal-edit";
import { WithdrawalOutcome } from "./withdrawal-outcome";
import { WithdrawalReview } from "./withdrawal-review";

/**
 * The electronic withdrawal function (§ 356a BGB): the details, their review
 * with the confirmation, then the outcome. Each step change moves focus to the
 * title of what replaced the control that was used.
 */
export function WithdrawalForm() {
  const flow = useWithdrawal();
  const { step } = flow;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step.kind);

  useEffect(() => {
    // The page opens on the form: focus moves only once the step changed.
    if (shownStep.current === step.kind) return;
    shownStep.current = step.kind;
    titleRef.current?.focus();
  }, [step.kind]);

  return (
    <Card className="flex min-h-80 flex-col p-6 sm:p-8">
      {step.kind === "edit" ? (
        <WithdrawalEdit
          values={flow.values}
          onChange={flow.setValue}
          honeypot={flow.honeypot}
          onHoneypotChange={flow.setHoneypot}
          invalidFields={flow.invalidFields}
          titleRef={titleRef}
          onSubmit={flow.review}
        />
      ) : step.kind === "review" ? (
        <WithdrawalReview
          declaration={step.declaration}
          titleRef={titleRef}
          onConfirm={() => void flow.confirm()}
          onEdit={flow.edit}
        />
      ) : (
        <WithdrawalOutcome
          result={step.kind === "done" ? step.result : null}
          titleRef={titleRef}
          onConfirmAgain={() => void flow.confirm()}
          onEdit={flow.edit}
        />
      )}
    </Card>
  );
}
