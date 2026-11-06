import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CheckMark } from "./check-mark";

const meta = {
  title: "Primitives/CheckMark",
  component: CheckMark,
} satisfies Meta<typeof CheckMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { className: "text-coral" } };

/** The glyph takes its colour from `currentColor` and its size from the caller. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <CheckMark className="text-coral" />
      <CheckMark className="size-5 text-ink" />
      <CheckMark className="size-8 text-ink-soft" />
      <span className="rounded-xl bg-navy p-3">
        <CheckMark className="size-6 text-coral-light" />
      </span>
    </div>
  ),
};
