import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card } from "./card";
import { Eyebrow } from "../typography/eyebrow";
import { Tag } from "./tag";

const meta = {
  title: "Primitives/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Card className="max-w-sm p-6">
      <Eyebrow>Mathematik</Eyebrow>
      <h3 className="mt-3 text-h4 text-ink">Analysis verstehen</h3>
      <p className="mt-2 text-body text-ink-soft">
        Ableitungen, Kurvendiskussion und Integrale — Schritt für Schritt statt
        Formel-Raten.
      </p>
      <div className="mt-4 flex gap-2">
        <Tag>Oberstufe</Tag>
        <Tag tone="inverse">Abitur</Tag>
      </div>
    </Card>
  ),
};
