import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Switch } from "./switch";
import { Button } from "../primitives/button";

const meta = {
  title: "Forms/Switch",
  component: Switch,
  args: { checked: false },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

const label = "Erinnerung per E-Mail";

/**
 * A controlled switch between two buttons inside a form, with its value,
 * changes and form submissions. `naming` picks how the switch gets its name.
 */
function Example({
  initial = false,
  disabled,
  naming = "label",
  controls,
}: {
  initial?: boolean;
  disabled?: boolean;
  naming?: "label" | "aria-labelledby" | "aria-label";
  /** Buttons that change the value from outside and reset the form. */
  controls?: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  const [changes, setChanges] = useState(0);
  const [submits, setSubmits] = useState(0);
  const nameProps = {
    label: { id: "switch-example" },
    "aria-labelledby": { "aria-labelledby": "switch-example-label" },
    "aria-label": { "aria-label": label },
  }[naming];
  return (
    <form
      className="flex max-w-xl flex-col items-start gap-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((count) => count + 1);
      }}
    >
      <Button type="button" variant="outline">
        Davor
      </Button>
      <div className="flex items-center gap-3">
        <Switch
          {...nameProps}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(next) => {
            setChecked(next);
            setChanges((count) => count + 1);
          }}
        />
        {naming === "label" ? (
          <label htmlFor="switch-example" className="text-body text-ink">
            {label}
          </label>
        ) : naming === "aria-labelledby" ? (
          <span id="switch-example-label" className="text-body text-ink">
            {label}
          </span>
        ) : null}
      </div>
      <Button type="button" variant="outline">
        Danach
      </Button>
      {controls ? (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setChecked((value) => !value)}
          >
            Von außen umschalten
          </Button>
          <Button type="reset" variant="ghost">
            Formular zurücksetzen
          </Button>
        </div>
      ) : null}
      <p role="status" className="text-small">
        Wert: {String(checked)}, Änderungen: {changes}, Absendungen: {submits}
      </p>
    </form>
  );
}

// Named by its visible <label>; the value can also change from outside.
export const Default: Story = { render: () => <Example controls /> };

// Named by visible text through `aria-labelledby`.
export const Checked: Story = {
  render: () => <Example initial naming="aria-labelledby" />,
};

// Named by `aria-label` alone.
export const Unchecked: Story = {
  render: () => <Example naming="aria-label" />,
};

export const Disabled: Story = { render: () => <Example disabled /> };

export const DisabledChecked: Story = {
  render: () => <Example initial disabled />,
};
