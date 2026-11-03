import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "../primitives/button";

const meta = {
  title: "Overlays/Popover",
  component: Popover,
  args: { open: false, onOpenChange: () => {}, children: null },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

const links = [
  { label: "Discord", note: "Server, Einrichtung und Funktionen" },
  { label: "Microsoft Teams", note: "Auch über Teams möglich" },
  { label: "Termin buchen", note: "Freie Slots im Kalender" },
];

function Example({ edge = false }: { edge?: boolean }) {
  const [open, setOpen] = useState(false);
  const [closes, setCloses] = useState(0);
  return (
    <div className="space-y-6 p-6">
      <div
        className={
          edge
            ? "-mx-6 flex items-center gap-2"
            : "flex items-center justify-end gap-2"
        }
      >
        {!edge && <Button variant="ghost">Davor</Button>}
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setCloses((count) => count + 1);
          }}
        >
          <PopoverTrigger>
            <Button variant="ghost">Plattformen</Button>
          </PopoverTrigger>
          <PopoverContent
            label="Plattformen"
            align="end"
            className="flex w-64 flex-col gap-0.5"
          >
            {links.map((link) => (
              <Button
                asChild
                key={link.label}
                variant="ghost"
                className="flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5"
              >
                <a href={`#${link.label}`} onClick={() => setOpen(false)}>
                  <span className="text-body font-semibold text-ink">
                    {link.label}
                  </span>
                  <span className="text-caption text-ink-soft">
                    {link.note}
                  </span>
                </a>
              </Button>
            ))}
          </PopoverContent>
        </Popover>
        <Button variant="primary">Danach</Button>
      </div>
      <Button variant="outline">Außerhalb</Button>
      <p role="status">Schließereignisse: {closes}</p>
    </div>
  );
}

export const Default: Story = { render: () => <Example /> };

// The trigger sits at the left viewport edge; collision handling shifts the
// end-aligned panel into view instead of clipping it.
export const ViewportEdge: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <Example edge />,
};
