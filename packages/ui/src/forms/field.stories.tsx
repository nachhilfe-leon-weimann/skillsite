import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Field, Input, Textarea } from "./field";

const meta = {
  title: "Forms/Field",
  component: Field,
  args: { label: "Vorname", htmlFor: "field-default", children: null },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A label and an input, nothing else. */
export const Default: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Field {...args}>
        <Input id="field-default" placeholder="Vorname" />
      </Field>
    </div>
  ),
};

/**
 * Every slot: a hint after the label, a description and an error below the
 * control, the required marker; with an `Input` and a `Textarea`. The control
 * takes `aria-describedby`, `aria-invalid` and `required` from its Field.
 */
export const Variants: Story = {
  render: () => (
    <form className="flex max-w-md flex-col gap-5">
      <Field label="Telefon" htmlFor="field-hint" hint="(optional)">
        <Input id="field-hint" type="tel" placeholder="0000 000000" />
      </Field>
      <Field
        label="E-Mail"
        htmlFor="field-description"
        description="Dorthin geht die Terminbestätigung."
      >
        <Input
          id="field-description"
          type="email"
          placeholder="name@example.com"
        />
      </Field>
      <Field
        label="Klassenstufe"
        htmlFor="field-error"
        error="Bitte gib eine Klassenstufe an."
      >
        <Input id="field-error" />
      </Field>
      <Field label="Name" htmlFor="field-required" required>
        <Input id="field-required" placeholder="Vor- und Nachname" />
      </Field>
      <Field
        label="Worum geht es?"
        htmlFor="field-textarea"
        required
        description="Ein, zwei Sätze genügen."
        error="Bitte beschreibe kurz dein Anliegen."
      >
        <Textarea id="field-textarea" rows={4} />
      </Field>
      <Field label="Nachricht" htmlFor="field-textarea-plain" hint="(optional)">
        <Textarea
          id="field-textarea-plain"
          rows={3}
          placeholder="Was sollte ich vorab wissen?"
        />
      </Field>
    </form>
  ),
};
