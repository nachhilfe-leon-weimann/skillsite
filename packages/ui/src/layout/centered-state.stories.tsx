import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarX, Check, LoaderCircle, TriangleAlert } from "lucide-react";

import { CenteredState } from "./centered-state";
import { Button } from "../primitives/button";
import { Text } from "../typography/text";

const meta = {
  title: "Layout/CenteredState",
  component: CenteredState,
  args: {
    icon: <Check className="size-6 text-coral" aria-hidden />,
    title: "Termin gebucht",
  },
} satisfies Meta<typeof CenteredState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The panel is a flex column, so the state centres in it. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-80 flex-col rounded-2xl border border-line bg-surface p-6">
      {children}
    </div>
  );
}

/** The four states a panel shows: loading, empty, done and failed. */
export const States: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
      <Panel>
        <CenteredState
          icon={
            <LoaderCircle
              className="size-6 text-coral motion-safe:animate-spin"
              aria-hidden
            />
          }
          title="Freie Termine werden geladen"
        />
      </Panel>
      <Panel>
        <CenteredState
          icon={<CalendarX className="size-6 text-coral" aria-hidden />}
          title="Keine freien Termine"
        >
          <Text size="small" tone="muted">
            In diesem Monat ist nichts mehr frei.
          </Text>
        </CenteredState>
      </Panel>
      <Panel>
        <CenteredState
          icon={<Check className="size-6 text-coral" aria-hidden />}
          title="Termin gebucht"
        >
          <Text size="small" tone="muted">
            Die Bestätigung kommt per E-Mail.
          </Text>
        </CenteredState>
      </Panel>
      <Panel>
        <CenteredState
          icon={<TriangleAlert className="size-6 text-coral" aria-hidden />}
          title="Das hat nicht geklappt"
        >
          <Text size="small" tone="muted" className="mb-4">
            Bitte versuche es gleich noch einmal.
          </Text>
          <Button size="sm">Nochmal versuchen</Button>
        </CenteredState>
      </Panel>
    </div>
  ),
};
