import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Pill } from "./pill";
import { Text } from "../typography/text";

const meta = {
  title: "Primitives/Pill",
  component: Pill,
  args: { children: "Kostenloses Kennenlernen", tone: "muted", size: "sm" },
  argTypes: {
    tone: {
      control: "select",
      options: ["inverse", "accent", "muted", "on-accent"],
    },
    size: { control: "select", options: ["sm", "code", "doc", "md"] },
    as: { control: "select", options: ["span", "div"] },
  },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const sizes = ["sm", "code", "doc", "md"] as const;

/**
 * Every tone in every size. `inverse` is outlined on navy and coral,
 * `on-accent` is a wash on coral; `as="div"` renders the pill as a block
 * container.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-4xl flex-col gap-6">
      {(["accent", "muted"] as const).map((tone) => (
        <div key={tone} className="flex flex-wrap items-center gap-3">
          <Text as="span" size="caption" tone="muted" className="w-20">
            {tone}
          </Text>
          {sizes.map((size) => (
            <Pill key={size} tone={tone} size={size}>
              {size}: Online-Unterricht
            </Pill>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-navy p-4">
        <Text as="span" size="caption" tone="inverse-soft" className="w-20">
          inverse
        </Text>
        {sizes.map((size) => (
          <Pill key={size} tone="inverse" size={size}>
            {size}: Online-Unterricht
          </Pill>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-coral-gradient p-4 text-white">
        <Text as="span" size="caption" tone="inherit" className="w-20">
          inverse, on-accent
        </Text>
        <Pill tone="inverse">inverse: Online-Unterricht</Pill>
        {sizes.map((size) => (
          <Pill key={size} tone="on-accent" size={size}>
            {size}: Online-Unterricht
          </Pill>
        ))}
      </div>
      <div className="flex flex-col items-start gap-3">
        <Text as="span" size="caption" tone="muted">
          as: span, div
        </Text>
        <Pill as="span">span: im Textfluss</Pill>
        <Pill as="div" className="w-fit">
          div: als Block
        </Pill>
      </div>
    </div>
  ),
};
