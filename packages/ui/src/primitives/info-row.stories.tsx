import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays, Clock, Mail } from "lucide-react";

import { InfoRow } from "./info-row";

const meta = {
  title: "Primitives/InfoRow",
  component: InfoRow,
  args: {
    icon: <Clock className="size-4" aria-hidden />,
    children: "60 Minuten, online",
  },
} satisfies Meta<typeof InfoRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default variant, `inverse`: one line on navy. */
export const Default: Story = {
  render: (args) => (
    <div className="max-w-sm rounded-2xl bg-navy p-5">
      <InfoRow {...args} />
    </div>
  ),
};

/** Every variant: `inverse` (the default) on navy, `summary` and `doc` on light surfaces. */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-navy p-5">
        <InfoRow icon={<Clock className="size-4" aria-hidden />}>
          inverse: 60 Minuten, online
        </InfoRow>
        <InfoRow
          variant="inverse"
          icon={<CalendarDays className="size-4" aria-hidden />}
        >
          inverse: Termin nach Absprache
        </InfoRow>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <InfoRow
          variant="summary"
          label="Dein Termin"
          icon={<CalendarDays className="size-4" aria-hidden />}
        >
          Donnerstag, 12. November, 16:00 Uhr
        </InfoRow>
      </div>
      <div className="rounded-2xl border border-line bg-surface-2 p-5">
        <InfoRow
          variant="doc"
          label="E-Mail"
          icon={<Mail className="size-4" aria-hidden />}
        >
          kontakt@example.com
        </InfoRow>
      </div>
    </div>
  ),
};
