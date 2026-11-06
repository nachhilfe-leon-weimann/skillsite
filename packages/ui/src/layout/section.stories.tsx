import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Section } from "./section";
import { Heading } from "../typography/heading";
import { Text } from "../typography/text";

const meta = {
  title: "Layout/Section",
  component: Section,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

function Content({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-4">
      <Heading as="h2" size="h4" className="text-ink">
        {label}
      </Heading>
      <Text tone="muted" className="mt-2">
        Platzhalterinhalt eines Abschnitts.
      </Text>
    </div>
  );
}

/**
 * Every combination of `surface` (the white band with hairlines), `spacing`
 * (`default` and `sm`) and `bleed` (no inner Container: the caller sets the
 * width).
 */
export const Variants: Story = {
  render: () => (
    <div>
      <Section>
        <Content label="Standard" />
      </Section>
      <Section surface>
        <Content label="surface" />
      </Section>
      <Section spacing="sm">
        <Content label="spacing sm" />
      </Section>
      <Section surface spacing="sm">
        <Content label="surface, spacing sm" />
      </Section>
      <Section bleed>
        <Content label="bleed" />
      </Section>
      <Section surface bleed>
        <Content label="surface, bleed" />
      </Section>
    </div>
  ),
};
