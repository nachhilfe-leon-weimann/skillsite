"use client";

import { Fragment } from "react";

import { Card } from "@skillsite/ui/primitives/card";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Text } from "@skillsite/ui/typography/text";
import { bookerText } from "@/content/booking";
import type { OrderSummaryRow } from "../model/order-summary";

const text = bookerText.form.orderSummary;

/**
 * The essential terms of a paid booking, placed right above its submit button
 * so they show there on a phone too, where the side panel is far above.
 */
export function OrderSummary({ rows }: { rows: OrderSummaryRow[] }) {
  return (
    <Card surface="subtle" className="p-4">
      <Eyebrow as="p" dot={false} tone="muted">
        {text.title}
      </Eyebrow>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-small">
        {rows.map((row) => (
          <Fragment key={row.label}>
            <dt className="text-ink-soft">{row.label}</dt>
            <dd className="text-right font-semibold text-ink">{row.value}</dd>
          </Fragment>
        ))}
      </dl>
      <Text size="caption" tone="muted" className="mt-2">
        {text.payment}
      </Text>
    </Card>
  );
}
