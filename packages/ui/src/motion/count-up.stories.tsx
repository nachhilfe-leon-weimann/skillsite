import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CountUp } from "./count-up";
import { Button } from "../primitives/button";
import { Heading } from "../typography/heading";
import { Text } from "../typography/text";

const meta = {
  title: "Motion/CountUp",
  component: CountUp,
  args: { value: "120+" },
} satisfies Meta<typeof CountUp>;

export default meta;
type Story = StoryObj<typeof meta>;

const stats = [
  { value: "120+", label: "Beispielwert mit Suffix" },
  { value: "€ 45", label: "Beispielwert mit Präfix" },
  { value: "7", label: "Ganze Zahl" },
  { value: "24/7", label: "Kein Zahlenwert: wörtlich" },
];

function Example() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-start gap-6">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setRun((count) => count + 1)}
      >
        Nochmal zählen
      </Button>
      <dl key={run} className="grid gap-6 sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className="text-ink">
            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <Heading as="span" size="h2">
                <CountUp value={stat.value} delay={index * 120} />
              </Heading>
              <Text size="small" tone="muted" className="mt-1">
                {stat.label}
              </Text>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Stat values count up once in view and end at their value; reduced motion
 * shows the value at once. Only the digits count; a value that is no number
 * renders as it is.
 */
export const Stats: Story = { render: () => <Example /> };
