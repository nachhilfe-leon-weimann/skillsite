import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Reveal } from "./reveal";
import { Button } from "../primitives/button";
import { Card } from "../primitives/card";
import { Text } from "../typography/text";

const meta = {
  title: "Motion/Reveal",
  component: Reveal,
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants = ["rise", "rise-soft", "fade", "settle"] as const;

/**
 * Plays its children once, and again from the button (a remount). Every
 * reveal here starts in view, so each ends shown; with reduced motion it is
 * shown at once.
 */
function Replay({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setRun((count) => count + 1)}
      >
        Nochmal abspielen
      </Button>
      <div key={run} className="w-full">
        {children}
      </div>
    </div>
  );
}

function Grid({ trigger }: { trigger: "mount" | "in-view" }) {
  return (
    <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-4">
      {variants.map((variant, index) => (
        <Reveal key={variant} trigger={trigger} variant={variant} index={index}>
          <Card className="p-5 text-ink">
            <Text size="small">{variant}</Text>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

/** Every variant on mount: a CSS keyframe on paint, staggered by index. */
export const Mount: Story = {
  render: () => (
    <Replay>
      <Grid trigger="mount" />
    </Replay>
  ),
};

/** Every variant in view: the `.reveal` transition once the element is seen. */
export const InView: Story = {
  render: () => (
    <Replay>
      <Grid trigger="in-view" />
    </Replay>
  ),
};

/** The blur-to-sharp accent of an in-view reveal, and an explicit delay. */
export const BlurAndDelay: Story = {
  render: () => (
    <Replay>
      <div className="flex gap-4">
        <Reveal blur>
          <Card className="p-5 text-ink">
            <Text size="small">blur</Text>
          </Card>
        </Reveal>
        <Reveal delay={400} variant="fade">
          <Card className="p-5 text-ink">
            <Text size="small">delay 400 ms</Text>
          </Card>
        </Reveal>
      </div>
    </Replay>
  ),
};

/** `as` renders another component as the revealed element. */
export const AsCard: Story = {
  render: () => (
    <Replay>
      <Reveal as={Card} trigger="mount" surface="subtle" className="p-5">
        <Text size="small">Reveal als Card</Text>
      </Reveal>
    </Replay>
  ),
};
