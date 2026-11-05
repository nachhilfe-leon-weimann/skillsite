import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Accordion } from "./accordion";

const meta = {
  title: "Primitives/Accordion",
  component: Accordion,
  args: {
    items: [
      {
        question: "Wie läuft die erste Stunde ab?",
        answer:
          "Wir lernen uns kennen, schauen auf den aktuellen Stoff und legen gemeinsam die nächsten Schritte fest.",
      },
      {
        question: "Findet der Unterricht online statt?",
        answer:
          "Ja, per Videoanruf mit geteiltem Whiteboard. Du brauchst nur einen Laptop oder ein Tablet.",
      },
      {
        question: "Kann ich einen Termin verschieben?",
        answer:
          "Bis 24 Stunden vorher geht das kostenlos, eine kurze Nachricht genügt.",
      },
    ],
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single-open: opening one entry closes the other. All start closed. */
export const Default: Story = {
  render: (args) => (
    <div className="max-w-2xl">
      <Accordion {...args} />
    </div>
  ),
};
