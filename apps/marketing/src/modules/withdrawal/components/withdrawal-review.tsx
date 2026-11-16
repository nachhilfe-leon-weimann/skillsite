"use client";

import type { Ref } from "react";

import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { withdrawalText } from "@/content/withdrawal";
import type { WithdrawalDeclaration } from "../model/config";

const { review, declaration: labels } = withdrawalText;

type WithdrawalReviewProps = {
  declaration: WithdrawalDeclaration;
  titleRef?: Ref<HTMLHeadingElement>;
  onConfirm: () => void;
  onEdit: () => void;
};

/**
 * Step 2: the declaration as it will be sent, with the confirmation function
 * of § 356a (3) BGB ("Widerruf bestätigen") and the way back to the details.
 */
export function WithdrawalReview({
  declaration,
  titleRef,
  onConfirm,
  onEdit,
}: WithdrawalReviewProps) {
  const rows: [string, string][] = [
    [labels.name, declaration.name],
    [labels.email, declaration.email],
    [labels.contract, declaration.contract],
    [labels.note, declaration.note || labels.noNote],
  ];

  return (
    <div className="flex flex-col gap-5">
      <Heading
        as="h2"
        size="h4"
        ref={titleRef}
        tabIndex={-1}
        className="outline-none"
      >
        {review.title}
      </Heading>
      <Text tone="muted">{review.text}</Text>

      <Card surface="inset" className="flex flex-col gap-4 p-5">
        <Text className="font-semibold">{labels.statement}</Text>
        <dl className="flex flex-col gap-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-small font-semibold text-ink-soft">
                {label}
              </dt>
              <dd className="text-body whitespace-pre-line text-ink wrap-break-word">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onConfirm}>{review.confirm}</Button>
        <Button variant="outline" onClick={onEdit}>
          {review.edit}
        </Button>
      </div>
    </div>
  );
}
