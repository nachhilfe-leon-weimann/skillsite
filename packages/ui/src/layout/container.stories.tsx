import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Container } from "./container";
import { Text } from "../typography/text";

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every size: the site width (1280px), the FAQ column (820px) and the
 * testimonials column (880px), each with the side gutter. The dashed outline
 * marks the column.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 py-6">
      {(["page", "faq", "testimonials"] as const).map((size) => (
        <Container key={size} size={size}>
          <div className="rounded-xl border border-dashed border-line bg-surface p-4">
            <Text size="small">{size}</Text>
          </div>
        </Container>
      ))}
    </div>
  ),
};
