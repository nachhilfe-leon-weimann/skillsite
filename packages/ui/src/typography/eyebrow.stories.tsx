import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Eyebrow } from "./eyebrow";

const meta = {
  title: "Typography/Eyebrow",
  component: Eyebrow,
  args: { children: "Mathematik", tone: "accent", dot: true },
  argTypes: {
    tone: {
      control: "select",
      options: [
        "accent",
        "muted",
        "inverse-accent",
        "inverse-muted",
        "on-accent",
      ],
    },
  },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * Every tone, with and without the dot. The inverse tones sit on navy,
 * `on-accent` on coral.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      {[true, false].map((dot) => (
        <div key={String(dot)} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-6">
            <Eyebrow dot={dot} tone="accent">
              accent
            </Eyebrow>
            <Eyebrow dot={dot} tone="muted">
              muted
            </Eyebrow>
          </div>
          <div className="flex flex-wrap gap-6 rounded-2xl bg-navy p-4">
            <Eyebrow dot={dot} tone="inverse-accent">
              inverse-accent
            </Eyebrow>
            <Eyebrow dot={dot} tone="inverse-muted">
              inverse-muted
            </Eyebrow>
          </div>
          <div className="rounded-2xl bg-coral-gradient p-4">
            <Eyebrow dot={dot} tone="on-accent">
              on-accent
            </Eyebrow>
          </div>
        </div>
      ))}
      <Eyebrow as="p" dot={false} tone="muted">
        as p, ohne Punkt
      </Eyebrow>
    </div>
  ),
};
