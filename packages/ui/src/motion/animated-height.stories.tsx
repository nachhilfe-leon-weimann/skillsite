import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AnimatedHeight } from "./animated-height";
import { Button } from "../primitives/button";
import { Card } from "../primitives/card";
import { Text } from "../typography/text";

const meta = {
  title: "Motion/AnimatedHeight",
  component: AnimatedHeight,
  args: { children: null },
} satisfies Meta<typeof AnimatedHeight>;

export default meta;
type Story = StoryObj<typeof meta>;

function Example() {
  const [long, setLong] = useState(false);
  return (
    <div className="flex max-w-md flex-col items-start gap-4">
      <Button size="sm" variant="outline" onClick={() => setLong((v) => !v)}>
        {long ? "Kurzen Schritt zeigen" : "Langen Schritt zeigen"}
      </Button>
      <Card className="w-full">
        <AnimatedHeight className="p-5 text-ink">
          {long ? (
            <div className="flex flex-col gap-3">
              <Text>Schritt 2: Deine Angaben</Text>
              <Text size="small" tone="muted">
                Name, E-Mail und Fach – damit die erste Stunde gut vorbereitet
                ist.
              </Text>
              <Text size="small" tone="muted">
                Die Angaben dienen hier nur als Platzhalter.
              </Text>
            </div>
          ) : (
            <Text>Schritt 1: Termin wählen</Text>
          )}
        </AnimatedHeight>
      </Card>
    </div>
  );
}

/** The panel follows its content's height when one step replaces another. */
export const Default: Story = { render: () => <Example /> };
