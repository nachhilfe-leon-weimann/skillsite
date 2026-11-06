import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AnimatedCheckMark } from "./animated-check-mark";
import { Button } from "../primitives/button";

const meta = {
  title: "Motion/AnimatedCheckMark",
  component: AnimatedCheckMark,
} satisfies Meta<typeof AnimatedCheckMark>;

export default meta;
type Story = StoryObj<typeof meta>;

function Example() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setRun((count) => count + 1)}
      >
        Nochmal zeichnen
      </Button>
      <div key={run} className="flex gap-3">
        {[0, 1, 2, 3].map((index) => (
          <AnimatedCheckMark
            key={index}
            index={index}
            className="size-6 text-coral"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The check strokes itself in once in view, staggered by `index`, and ends
 * fully drawn; reduced motion draws it at once.
 */
export const Default: Story = { render: () => <Example /> };
