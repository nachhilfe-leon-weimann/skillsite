import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Collapsible } from "./collapsible";
import { Button } from "../primitives/button";
import { Text } from "../typography/text";

const meta = {
  title: "Motion/Collapsible",
  component: Collapsible,
  args: { open: false },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

function Example({ initial }: { initial: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="flex max-w-md flex-col items-start gap-3">
      <Button
        size="sm"
        variant="outline"
        aria-expanded={open}
        aria-controls="collapsible-panel"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Details ausblenden" : "Details zeigen"}
      </Button>
      <Collapsible open={open} id="collapsible-panel">
        <div className="rounded-xl border border-line bg-surface p-4">
          <Text size="small">
            Ausgeblendeter Inhalt bleibt gerendert, ist aber inert: nicht
            fokussierbar und nicht im Barrierefreiheitsbaum.
          </Text>
        </div>
      </Collapsible>
      <Text size="caption" tone="muted">
        Text unter dem Panel
      </Text>
    </div>
  );
}

export const Closed: Story = { render: () => <Example initial={false} /> };
export const Open: Story = { render: () => <Example initial /> };
