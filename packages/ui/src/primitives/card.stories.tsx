import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card } from "./card";
import { SmartLink } from "./link";
import { Eyebrow } from "../typography/eyebrow";
import { Heading } from "../typography/heading";
import { Text } from "../typography/text";
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

const surfaces = ["raised", "flat", "inset", "subtle", "doc", "frame"] as const;
const radii = ["xl", "2xl", "3xl", "callout"] as const;
const lifts = ["none", "sm", "md"] as const;

function Sample({ label }: { label: string }) {
  return (
    <>
      <Heading as="h3" size="card-title-sm">
        {label}
      </Heading>
      <Text size="small" tone="inherit" className="mt-1">
        Beispielinhalt einer Karte
      </Text>
    </>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <Text size="caption" tone="muted">
        {label}
      </Text>
      {children}
    </section>
  );
}

/**
 * Every tone, surface, radius and lift. `inset` sits on a surface band and
 * `glass` on navy, where they are used; the lifting cards are links
 * (`asChild`) and lift on hover.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-4xl flex-col gap-8">
      <Group label="tone">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 text-ink">
            <Sample label="default" />
          </Card>
          <Card tone="inverse" className="p-5 text-on-navy">
            <Sample label="inverse" />
          </Card>
          <Card tone="accent" className="p-5">
            <Sample label="accent" />
          </Card>
        </div>
      </Group>
      <Group label="surface">
        <div className="grid gap-4 rounded-3xl border border-line bg-surface p-4 sm:grid-cols-3">
          {surfaces.map((surface) => (
            <Card key={surface} surface={surface} className="p-5 text-ink">
              <Sample label={surface} />
            </Card>
          ))}
        </div>
        <div className="rounded-3xl bg-navy p-4">
          <Card surface="glass" className="p-5 text-on-navy">
            <Sample label="glass" />
          </Card>
        </div>
      </Group>
      <Group label="radius">
        <div className="grid gap-4 sm:grid-cols-4">
          {radii.map((radius) => (
            <Card key={radius} radius={radius} className="p-5 text-ink">
              <Sample label={radius} />
            </Card>
          ))}
        </div>
      </Group>
      <Group label="lift, asChild">
        <div className="grid gap-4 sm:grid-cols-3">
          {lifts.map((lift) => (
            <Card key={lift} asChild lift={lift} className="block p-5 text-ink">
              <SmartLink href="#karte">
                <Sample label={`lift ${lift}`} />
              </SmartLink>
            </Card>
          ))}
        </div>
      </Group>
    </div>
  ),
};
