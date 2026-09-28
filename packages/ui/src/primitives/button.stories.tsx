import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button, LinkButton } from "./button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: {
    children: "Termin buchen",
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "navy", "outline", "white", "ghost"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="navy">
        Navy
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <span className="rounded-xl bg-navy p-3">
        <Button {...args} variant="white">
          White
        </Button>
      </span>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} size="sm">
        Klein
      </Button>
      <Button {...args} size="md">
        Mittel
      </Button>
      <Button {...args} size="lg">
        Groß
      </Button>
    </div>
  ),
};

export const AsLink: Story = {
  render: (args) => (
    <LinkButton href="https://example.com" variant={args.variant}>
      Externer Link
    </LinkButton>
  ),
};
