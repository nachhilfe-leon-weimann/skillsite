import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Address, Text, type TextSize } from "./text";

const meta = {
  title: "Typography/Text",
  component: Text,
  args: {
    children: "Wir starten mit einer kostenlosen Kennenlernstunde.",
    size: "body",
    tone: "default",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["lead", "body", "small", "caption", "note"],
    },
    tone: {
      control: "select",
      options: ["default", "muted", "inverse", "inverse-soft", "inherit"],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const sizes: TextSize[] = ["lead", "body", "small", "caption", "note"];

/** Every size and every tone; the inverse tones sit on navy, `inherit` takes the parent's colour. */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        {sizes.map((size) => (
          <Text key={size} size={size}>
            {size}: Danach bauen wir Lücken systematisch ab.
          </Text>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Text tone="default">default: Termine flexibel online.</Text>
        <Text tone="muted">muted: Termine flexibel online.</Text>
        <div className="text-coral">
          <Text tone="inherit">inherit: Termine flexibel online.</Text>
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-navy p-5">
        <Text tone="inverse">inverse: Termine flexibel online.</Text>
        <Text tone="inverse-soft">inverse-soft: Termine flexibel online.</Text>
      </div>
    </div>
  ),
};

/** A postal address: body type, upright. */
export const PostalAddress: Story = {
  render: () => (
    <Address>
      Beispielstraße 1
      <br />
      12345 Musterstadt
    </Address>
  ),
};
