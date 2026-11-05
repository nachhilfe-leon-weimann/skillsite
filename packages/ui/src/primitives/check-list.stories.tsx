import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CheckList } from "./check-list";

const items = [
  "Kostenlose Kennenlernstunde",
  "Feste Ansprechperson für alle Termine",
  "Lernmaterial nach jeder Stunde",
];

const meta = {
  title: "Primitives/CheckList",
  component: CheckList,
  args: { items, size: "md", tone: "default" },
  argTypes: {
    size: { control: "select", options: ["md", "sm"] },
    tone: { control: "select", options: ["default", "inverse"] },
  },
} satisfies Meta<typeof CheckList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Both sizes in both tones; `inverse` sits on navy. The marks draw in once in view. */
export const Variants: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
      <CheckList items={items} size="md" />
      <CheckList items={items} size="sm" />
      <div className="rounded-2xl bg-navy p-5">
        <CheckList items={items} size="md" tone="inverse" />
      </div>
      <div className="rounded-2xl bg-navy p-5">
        <CheckList items={items} size="sm" tone="inverse" />
      </div>
    </div>
  ),
};
