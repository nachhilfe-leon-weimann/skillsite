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

function PanelLinks({ onNavigate }: { onNavigate: () => void }) {
  return links.map((link) => (
    <Button
      asChild
      key={link.label}
      variant="ghost"
      className="flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5"
    >
      <a href={`#${link.label}`} onClick={onNavigate}>
        <span className="text-body font-semibold text-ink">{link.label}</span>
        <span className="text-caption text-ink-soft">{link.note}</span>
      </a>
    </Button>
  ));
}

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
            <PanelLinks onNavigate={() => setOpen(false)} />
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

function HoverExample() {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="flex justify-end p-6">
      <div
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <Popover open={hovered} onOpenChange={setHovered}>
          <PopoverTrigger>
            <Button variant="ghost">Plattformen</Button>
          </PopoverTrigger>
          <PopoverContent
            label="Plattformen"
            align="end"
            className="flex w-64 flex-col gap-0.5"
            hitTestableExit
          >
            <PanelLinks onNavigate={() => setHovered(false)} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// A hover consumer: the panel opens while the pointer is over the trigger or the
// panel. With `hitTestableExit`, the fading panel still catches the pointer, so
// coming back onto it before it has faded out turns it around.
export const HoverExit: Story = { render: () => <HoverExample /> };

function AlignedExample({ align }: { align: "start" | "center" | "end" }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="outline">{align}</Button>
      </PopoverTrigger>
      <PopoverContent
        label={`Plattformen (${align})`}
        align={align}
        className="flex w-64 flex-col gap-0.5"
      >
        <PanelLinks onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

// The panel aligned to the trigger's start, centre or end.
export const Alignments: Story = {
  render: () => (
    <div className="flex justify-center gap-6 p-6">
      {(["start", "center", "end"] as const).map((align) => (
        <AlignedExample key={align} align={align} />
      ))}
    </div>
  ),
};
