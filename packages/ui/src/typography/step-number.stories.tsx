import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StepNumber, type StepNumberSize } from "./step-number";

const meta = {
  title: "Typography/StepNumber",
  component: StepNumber,
  args: { children: "01", size: "lg" },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    as: { control: "select", options: ["span", "p", "div"] },
  },
} satisfies Meta<typeof StepNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const sizes: StepNumberSize[] = ["sm", "md", "lg"];

/** Every size, inline as a span and as a block-level paragraph. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-6">
        {sizes.map((size, i) => (
          <StepNumber key={size} size={size}>
            0{i + 1}
          </StepNumber>
        ))}
      </div>
      <StepNumber as="p" size="md">
        04
      </StepNumber>
    </div>
  ),
};
