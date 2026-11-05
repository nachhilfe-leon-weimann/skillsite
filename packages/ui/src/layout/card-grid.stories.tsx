import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CardGrid } from "./card-grid";
import { Card } from "../primitives/card";
import { Text } from "../typography/text";

const meta = {
  title: "Layout/CardGrid",
  component: CardGrid,
} satisfies Meta<typeof CardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const subjects = [
  "Mathe",
  "Physik",
  "Informatik",
  "Englisch",
  "Deutsch",
  "Chemie",
];

/** Every column set and both gaps; one column below the first breakpoint. */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-5xl flex-col gap-8">
      {(["sm-3", "sm-2", "sm-2-lg-3", "md-2"] as const).map((columns) =>
        (["5", "4"] as const).map((gap) => (
          <div key={`${columns}-${gap}`} className="flex flex-col gap-2">
            <Text size="caption" tone="muted">
              columns {columns}, gap {gap}
            </Text>
            <CardGrid columns={columns} gap={gap}>
              {subjects.map((subject) => (
                <Card key={subject} className="p-5 text-ink">
                  <Text size="small">{subject}</Text>
                </Card>
              ))}
            </CardGrid>
          </div>
        )),
      )}
    </div>
  ),
};
