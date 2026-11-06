import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Split } from "./split";
import { Text } from "../typography/text";

const meta = {
  title: "Layout/Split",
  component: Split,
} satisfies Meta<typeof Split>;

export default meta;
type Story = StoryObj<typeof meta>;

function Panel({ label, tall }: { label: string; tall?: boolean }) {
  return (
    <div
      className={
        tall
          ? "rounded-xl border border-dashed border-line bg-surface p-4 pb-24"
          : "rounded-xl border border-dashed border-line bg-surface p-4"
      }
    >
      <Text size="small">{label}</Text>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Text size="caption" tone="muted">
        {label}
      </Text>
      {children}
    </div>
  );
}

const ratios = ["1/1", "1.15/0.85", "1.05/0.95", "0.9/1.1", "1.25/1"] as const;
const gaps = ["split", "split-hero", "split-about", "5"] as const;
const aligns = ["center", "start", "stretch"] as const;

/**
 * Every ratio, gap and alignment. Two columns from `lg` on, one below; the
 * alignment shows against a taller right panel.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {ratios.map((ratio) => (
        <Row key={ratio} label={`ratio ${ratio}`}>
          <Split ratio={ratio} gap="5">
            <Panel label="Text" />
            <Panel label="Bild oder Panel" />
          </Split>
        </Row>
      ))}
      {gaps.map((gap) => (
        <Row key={gap} label={`gap ${gap}`}>
          <Split gap={gap}>
            <Panel label="Text" />
            <Panel label="Bild oder Panel" />
          </Split>
        </Row>
      ))}
      {aligns.map((align) => (
        <Row key={align} label={`align ${align}`}>
          <Split align={align} gap="5">
            <Panel label="Text" />
            <Panel label="Höheres Panel" tall />
          </Split>
        </Row>
      ))}
    </div>
  ),
};
