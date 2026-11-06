import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Heading, type HeadingSize } from "./heading";
import { Lead } from "./lead";
import { Text } from "./text";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  args: { children: "Mathe endlich verstehen", size: "h2", tone: "inherit" },
  argTypes: {
    size: {
      control: "select",
      options: [
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "title",
        "card-title",
        "card-title-sm",
        "step-title",
      ],
    },
    tone: {
      control: "select",
      options: ["inherit", "default", "muted", "inverse", "inverse-soft"],
    },
    wrap: { control: "select", options: ["balance", "normal"] },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The type scale from display to body, as a page stacks it. */
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

const sizes: HeadingSize[] = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "title",
  "card-title",
  "card-title-sm",
  "step-title",
];

/**
 * Every size, every tone and both wraps. `inherit` takes the parent's colour;
 * the inverse tones sit on navy. `balance` balances and hyphenates a long
 * heading, `normal` does not.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-col gap-8 text-ink">
      <div className="flex flex-col gap-3">
        {sizes.map((size) => (
          <Heading key={size} as="p" size={size}>
            {size}: Fächer und Stufen
          </Heading>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Heading as="p" size="h4" tone="inherit">
          inherit: Fächer und Stufen
        </Heading>
        <Heading as="p" size="h4" tone="default">
          default: Fächer und Stufen
        </Heading>
        <Heading as="p" size="h4" tone="muted">
          muted: Fächer und Stufen
        </Heading>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-navy p-5">
        <Heading as="p" size="h4" tone="inverse">
          inverse: Fächer und Stufen
        </Heading>
        <Heading as="p" size="h4" tone="inverse-soft">
          inverse-soft: Fächer und Stufen
        </Heading>
      </div>
      <div className="grid max-w-md gap-4">
        <Heading as="p" size="h3" wrap="balance">
          balance: Unterrichtsvorbereitung für Prüfungswochen
        </Heading>
        <Heading as="p" size="h3" wrap="normal">
          normal: Unterrichtsvorbereitung für Prüfungswochen
        </Heading>
      </div>
    </div>
  ),
};
