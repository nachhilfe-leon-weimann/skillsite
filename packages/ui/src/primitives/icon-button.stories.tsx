import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

import { IconButton } from "./icon-button";
import { Text } from "../typography/text";

const meta = {
  title: "Primitives/IconButton",
  component: IconButton,
  args: {
    "aria-label": "Nächster Monat",
    children: <ChevronRight className="size-4" aria-hidden />,
    size: "md",
    surface: "default",
    hover: "border",
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Text as="span" size="caption" tone="muted" className="w-20">
        {label}
      </Text>
      {children}
    </div>
  );
}

const next = <ChevronRight className="size-4" aria-hidden />;

/**
 * Every size, surface and hover feedback, and the disabled look. `inset` sits
 * on a surface band; `hover="none"` is the menu toggle.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <Row label="size">
        {(["sm", "md", "lg"] as const).map((size) => (
          <IconButton key={size} size={size} aria-label={`Weiter (${size})`}>
            {next}
          </IconButton>
        ))}
      </Row>
      <div className="rounded-2xl border border-line bg-surface p-4">
        <Row label="surface">
          <IconButton surface="default" aria-label="Weiter (default)">
            {next}
          </IconButton>
          <IconButton surface="inset" aria-label="Weiter (inset)">
            {next}
          </IconButton>
        </Row>
      </div>
      <Row label="hover">
        <IconButton hover="border" aria-label="Weiter (border)">
          {next}
        </IconButton>
        <IconButton hover="none" aria-label="Menü öffnen">
          <Menu className="size-5" aria-hidden />
        </IconButton>
      </Row>
      <Row label="disabled">
        <IconButton disabled aria-label="Vorheriger Monat">
          <ChevronLeft className="size-4" aria-hidden />
        </IconButton>
        <IconButton disabled={false} aria-label="Nächster Monat">
          {next}
        </IconButton>
      </Row>
    </div>
  ),
};
