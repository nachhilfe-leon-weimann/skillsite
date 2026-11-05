import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tag } from "./tag";

const meta = {
  title: "Primitives/Tag",
  component: Tag,
  args: { children: "Sehr gefragt", tone: "accent" },
  argTypes: {
    tone: { control: "select", options: ["accent", "inverse", "outline"] },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every tone. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Tag tone="accent">accent: Sehr gefragt</Tag>
      <Tag tone="inverse">inverse: Neu</Tag>
      <Tag tone="outline">outline: Oberstufe</Tag>
    </div>
  ),
};
