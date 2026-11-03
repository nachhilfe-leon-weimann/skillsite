import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Heading } from "./heading";
import { Lead } from "./lead";
import { Text } from "./text";

const meta = {
  title: "Primitives/Typography",
  component: Heading,
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScale: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-col gap-6">
      <Heading size="display">Display — Nachhilfe, die ankommt</Heading>
      <Heading size="h1">H1 — Mathe endlich verstehen</Heading>
      <Heading size="h2">H2 — So läuft eine Stunde ab</Heading>
      <Heading size="h3">H3 — Fächer und Stufen</Heading>
      <Heading size="h4">H4 — Preise im Überblick</Heading>
      <Lead>
        Lead — Einzelunterricht, der sich nach dir richtet: verständlich,
        strukturiert und mit Geduld erklärt.
      </Lead>
      <Text>
        Body — Wir starten mit einer kostenlosen Kennenlernstunde und schauen,
        wo du stehst. Danach bauen wir Lücken systematisch ab.
      </Text>
      <Text size="small" tone="muted">
        Small/muted — Termine flexibel online oder vor Ort.
      </Text>
    </div>
  ),
};
