import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";

import { StatusPage } from "./status-page";
import { Button } from "../primitives/button";
import { Text } from "../typography/text";

const meta = {
  title: "Layout/StatusPage",
  component: StatusPage,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Fehler 404",
    title: "Diese Seite gibt es nicht",
    lead: "Vielleicht hat sich die Adresse geändert. Von der Startseite aus findest du alles Weitere.",
    actions: null,
  },
} satisfies Meta<typeof StatusPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A page that is only a status message, with its actions. */
export const Default: Story = {
  render: (args) => (
    <StatusPage
      {...args}
      actions={
        <>
          <Button asChild>
            <Link href="/">Zur Startseite</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/kontakt">Kontakt</Link>
          </Button>
        </>
      }
    />
  ),
};

/** With lines below the actions. */
export const WithNote: Story = {
  render: (args) => (
    <StatusPage
      {...args}
      eyebrow="Link nicht nutzbar"
      title="Dieser Link ist abgelaufen"
      actions={<Button>Neuen Link anfordern</Button>}
    >
      <Text size="small" tone="muted" className="mt-6">
        Beispielhinweis unter den Aktionen.
      </Text>
    </StatusPage>
  ),
};
