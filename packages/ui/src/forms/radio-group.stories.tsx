import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupRoot,
  type ChoiceOption,
} from "./radio-group";
import { Button } from "../primitives/button";

const meta = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  args: { label: "", value: "", options: [], onChange: () => {} },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const platforms: ChoiceOption[] = [
  { value: "teams", label: "Microsoft Teams", hint: "Im Browser oder als App" },
  { value: "discord", label: "Discord", hint: "Mit Bildschirmfreigabe" },
  { value: "telefon", label: "Telefon" },
];

/** A controlled group between two buttons, with its value and changes, inside a form. */
function Example({
  options = platforms,
  initial = "",
  required,
  disabled,
}: {
  options?: ChoiceOption[];
  initial?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [changes, setChanges] = useState(0);
  const [submits, setSubmits] = useState(0);
  return (
    <form
      className="flex max-w-xl flex-col gap-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((count) => count + 1);
      }}
    >
      <Button type="button" variant="outline">
        Davor
      </Button>
      <RadioGroup
        label="Plattform"
        options={options}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(next) => {
          setValue(next);
          setChanges((count) => count + 1);
        }}
      />
      <Button type="button" variant="outline">
        Danach
      </Button>
      <p role="status" className="text-small">
        Wert: {JSON.stringify(value)}, Änderungen: {changes}, Absendungen:{" "}
        {submits}
      </p>
    </form>
  );
}

// The booking form's platform choice: preselected and required.
export const Default: Story = {
  render: () => <Example initial="teams" required />,
};

// An optional group may start empty; nothing is preselected.
export const Empty: Story = { render: () => <Example /> };

export const DisabledOption: Story = {
  render: () => (
    <Example
      initial="teams"
      options={platforms.map((option) =>
        option.value === "discord" ? { ...option, disabled: true } : option,
      )}
    />
  ),
};

export const Disabled: Story = {
  render: () => <Example initial="discord" disabled />,
};

function ComposedExample() {
  const [value, setValue] = useState("vormittags");
  return (
    <div className="flex max-w-xl flex-col gap-3 p-6">
      <p id="composed-label" className="text-small font-semibold text-ink">
        Tageszeit
      </p>
      <RadioGroupRoot
        value={value}
        onChange={setValue}
        aria-labelledby="composed-label"
        className="flex gap-2"
      >
        {["vormittags", "nachmittags", "abends"].map((option) => (
          <RadioGroupItem
            key={option}
            value={option}
            className={
              value === option
                ? "rounded-lg border border-coral px-3 py-2 text-small text-ink"
                : "rounded-lg border border-line px-3 py-2 text-small text-ink-soft"
            }
          >
            {option}
          </RadioGroupItem>
        ))}
      </RadioGroupRoot>
      <p role="status" className="text-small">
        Wert: {JSON.stringify(value)}
      </p>
    </div>
  );
}

// The unstyled parts that RadioGroup and ChoiceChips build on, with a look of
// the consumer's own.
export const Composed: Story = { render: () => <ComposedExample /> };
