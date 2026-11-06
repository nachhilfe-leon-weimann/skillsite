import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Lead } from "./lead";

const meta = {
  title: "Typography/Lead",
  component: Lead,
  args: {
    children:
      "Einzelunterricht, der sich nach dir richtet: verständlich, strukturiert und mit Geduld erklärt.",
  },
} satisfies Meta<typeof Lead>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The intro paragraph under a heading: lead size, muted. It has no variants. */
export const Default: Story = {
  render: (args) => <Lead {...args} className="max-w-measure-34" />,
};
