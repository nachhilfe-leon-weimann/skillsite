import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, Calculator, FlaskConical, Languages } from "lucide-react";

import { ChoiceChips } from "./choice-chips";
import type { ChoiceOption } from "./radio-group";
import { Button } from "../primitives/button";

const meta = {
  title: "Forms/ChoiceChips",
  component: ChoiceChips,
  args: { label: "", value: "", options: [], onChange: () => {} },
} satisfies Meta<typeof ChoiceChips>;
export default meta;
type Story = StoryObj<typeof meta>;

const subjects: ChoiceOption[] = [
  { value: "Mathe", label: "Mathe", icon: Calculator },
  { value: "Physik", label: "Physik", icon: FlaskConical },
  { value: "Englisch", label: "Englisch", icon: Languages },
  { value: "Deutsch", label: "Deutsch", icon: BookOpen },
];

const withDisabled = subjects.map((option) =>
  option.value === "Physik" ? { ...option, disabled: true } : option,
);

/** A form around the chips, with their value, changes and submissions. */
function Frame({
  value,
  changes,
  children,
}: {
  value: string | string[];
  changes: number;
  children: React.ReactNode;
}) {
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
      {children}
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

function SingleExample({
  initial = "",
  options = subjects,
  disabled,
}: {
  initial?: string;
  options?: ChoiceOption[];
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [changes, setChanges] = useState(0);
  return (
    <Frame value={value} changes={changes}>
      <ChoiceChips
        label="In welchem Fach kann ich dir helfen?"
        required
        disabled={disabled}
        options={options}
        value={value}
        onChange={(next) => {
          setValue(next);
          setChanges((count) => count + 1);
        }}
      />
    </Frame>
  );
}

function MultipleExample({
  initial = [],
  options = subjects,
  disabled,
}: {
  initial?: string[];
  options?: ChoiceOption[];
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [changes, setChanges] = useState(0);
  return (
    <Frame value={value} changes={changes}>
      <ChoiceChips
        multiple
        label="Fächer"
        required
        disabled={disabled}
        options={options}
        value={value}
        onChange={(next) => {
          setValue(next);
          setChanges((count) => count + 1);
        }}
      />
    </Frame>
  );
}

// One subject, as a radio group; it starts empty, as in the booking form.
export const Single: Story = { render: () => <SingleExample /> };

export const SinglePreselected: Story = {
  render: () => <SingleExample initial="Englisch" />,
};

// Several subjects, each an independent pressed toggle.
export const Multiple: Story = {
  render: () => <MultipleExample initial={["Physik"]} />,
};

export const DisabledChip: Story = {
  render: () => (
    <div>
      <SingleExample initial="Mathe" options={withDisabled} />
      <MultipleExample options={withDisabled} />
    </div>
  ),
};

// The whole group disabled, single and multiple.
export const Disabled: Story = {
  render: () => (
    <div>
      <SingleExample initial="Mathe" disabled />
      <MultipleExample initial={["Englisch"]} disabled />
    </div>
  ),
};
