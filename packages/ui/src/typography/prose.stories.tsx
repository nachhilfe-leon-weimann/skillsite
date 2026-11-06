import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProseH2, ProseH3, ProseP } from "./prose";

const meta = {
  title: "Typography/Prose",
  component: ProseP,
} satisfies Meta<typeof ProseP>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Long legal text on the prose tokens: section heading, subheading, paragraph. */
export const Default: Story = {
  render: () => (
    <article className="flex max-w-3xl flex-col gap-4">
      <ProseH2>§ 1 Geltungsbereich</ProseH2>
      <ProseP>
        Diese Beispielbedingungen gelten für alle Unterrichtsstunden, die über
        die Website gebucht werden. Abweichende Vereinbarungen bedürfen der
        Textform.
      </ProseP>
      <ProseH3>1.1 Vertragsschluss</ProseH3>
      <ProseP>
        Der Vertrag kommt mit der Bestätigung des gebuchten Termins zustande.
        Dieser Absatz ist Platzhaltertext.
      </ProseP>
    </article>
  ),
};
