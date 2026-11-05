import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, CalendarCheck, Check } from "lucide-react";

import { IconBadge } from "./icon-badge";
import { Text } from "../typography/text";

const meta = {
  title: "Primitives/IconBadge",
  component: IconBadge,
  args: {
    children: <BookOpen className="size-5" aria-hidden />,
    layout: "flex",
    size: "10",
    shape: "xl",
    tone: "accent",
  },
} satisfies Meta<typeof IconBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const sizes = ["7.5", "8", "9", "9.5", "10", "13", "14"] as const;
const shapes = ["md", "lg", "xl", "full"] as const;
const tones = ["accent", "accent-12", "accent-16", "subtle", "muted"] as const;

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Text as="span" size="caption" tone="inherit" className="w-16">
        {label}
      </Text>
      {children}
    </div>
  );
}

const icon = <CalendarCheck className="size-4" aria-hidden />;

/**
 * Every size, shape, tone and layout. `accent-16` brings no icon colour: its
 * state icon sets its own. `inverse` sits on navy.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-5 text-ink-soft">
      <Row label="size">
        {sizes.map((size) => (
          <IconBadge key={size} size={size} title={size}>
            {icon}
          </IconBadge>
        ))}
      </Row>
      <Row label="shape">
        {shapes.map((shape) => (
          <IconBadge key={shape} shape={shape} title={shape}>
            {icon}
          </IconBadge>
        ))}
      </Row>
      <Row label="tone">
        {tones.map((tone) => (
          <IconBadge key={tone} tone={tone} title={tone}>
            {tone === "accent-16" ? (
              <Check className="size-4 text-coral" aria-hidden />
            ) : (
              icon
            )}
          </IconBadge>
        ))}
      </Row>
      <div className="rounded-2xl bg-navy p-4 text-on-navy-soft">
        <Row label="inverse">
          <IconBadge tone="inverse">{icon}</IconBadge>
        </Row>
      </div>
      <Row label="layout">
        <IconBadge layout="flex" title="flex">
          {icon}
        </IconBadge>
        <IconBadge as="div" layout="grid" title="grid">
          {icon}
        </IconBadge>
        <IconBadge size="9" shape="full" className="text-small font-bold">
          3
        </IconBadge>
      </Row>
    </div>
  ),
};
