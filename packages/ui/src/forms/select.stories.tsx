import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Clock } from "lucide-react";

import { Select, type SelectOption } from "./select";
import { Dialog } from "../overlays/dialog";
import { Button } from "../primitives/button";

const meta = {
  title: "Forms/Select",
  component: Select,
  args: { label: "", value: "", options: [], onChange: () => {} },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

const durations: SelectOption<number>[] = [
  { value: 45, label: "45 Minuten" },
  { value: 60, label: "60 Minuten" },
  { value: 90, label: "90 Minuten" },
];

const formats: SelectOption<string>[] = [
  { value: "online", label: "Online", hint: "Per Videoanruf" },
  { value: "telefon", label: "Telefon", hint: "Ohne Kamera" },
  { value: "", label: "Keine Angabe" },
];

const mixed: SelectOption<number | string>[] = [
  { value: 1, label: "Eins als Zahl" },
  { value: "1", label: "Eins als Text" },
  { value: "", label: "Leerer Text" },
];

/** A controlled Select with its value, its type and the number of changes. */
function Example<T extends string | number>({
  options,
  initial,
  label,
  hideLabel,
  tone,
  icon,
  disabled,
}: {
  options: SelectOption<T>[];
  initial: T;
  label: string;
  hideLabel?: boolean;
  tone?: "default" | "inverse";
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [changes, setChanges] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <Button variant="outline">Davor</Button>
      <Select
        label={label}
        hideLabel={hideLabel}
        tone={tone}
        icon={icon}
        disabled={disabled}
        value={value}
        options={options}
        onChange={(next) => {
          setValue(next);
          setChanges((count) => count + 1);
        }}
        className="w-72"
      />
      <Button variant="outline">Danach</Button>
      <p role="status" className="text-small">
        Wert: {JSON.stringify(value)} ({typeof value}), Änderungen: {changes}
      </p>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <Example label="Format" options={formats} initial="online" />
    </div>
  ),
};

// The booker's duration select: inverse tone on navy, hidden label, an icon.
export const Inverse: Story = {
  render: () => (
    <div className="bg-navy p-6 text-on-navy">
      <Example
        label="Dauer"
        hideLabel
        tone="inverse"
        icon={<Clock className="size-4" aria-hidden />}
        options={durations}
        initial={60}
      />
    </div>
  ),
};

// `1`, `"1"` and `""` are distinct values; the status shows each one's type.
export const TypedValues: Story = {
  render: () => (
    <div className="p-6">
      <Example label="Wert" options={mixed} initial={1} />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="p-6">
      <Example label="Dauer" options={durations} initial={60} disabled />
    </div>
  ),
};

// Near the bottom edge, the panel opens above the trigger inside the viewport.
export const NearEdge: Story = {
  render: () => (
    <div className="flex min-h-screen flex-col justify-end p-6">
      <Example label="Format" options={formats} initial="online" />
    </div>
  ),
};

function DialogExample({ nested = false }: { nested?: boolean }) {
  const [open, setOpen] = useState(false);
  const [closes, setCloses] = useState(0);
  const [innerOpen, setInnerOpen] = useState(false);
  const id = useId();
  const close = () => {
    setOpen(false);
    setCloses((count) => count + 1);
  };
  return (
    <div className="space-y-4 p-6">
      <Button onClick={() => setOpen(true)}>Dialog öffnen</Button>
      <p role="log" className="text-small">
        Dialog geschlossen: {closes}
      </p>
      <Dialog open={open} onClose={close} labelledBy={`${id}-title`}>
        <h2 id={`${id}-title`} className="mb-4 text-h4">
          Termin anpassen
        </h2>
        <Example label="Dauer" options={durations} initial={60} />
        {/* Closes the dialog by itself, e.g. while the list is still leaving. */}
        <Button className="mt-4" onClick={close}>
          Schließen
        </Button>
        {nested ? (
          <Button className="mt-4 ml-2" onClick={() => setInnerOpen(true)}>
            Weiter
          </Button>
        ) : null}
      </Dialog>
      {nested ? (
        <Dialog
          open={innerOpen}
          onClose={() => setInnerOpen(false)}
          labelledBy={`${id}-inner`}
        >
          <h2 id={`${id}-inner`} className="mb-4 text-h4">
            Bestätigen
          </h2>
          <Button onClick={() => setInnerOpen(false)}>Zurück</Button>
        </Dialog>
      ) : null}
    </div>
  );
}

// Nested in a modal Dialog: Escape closes only the topmost layer.
export const InDialog: Story = { render: () => <DialogExample /> };

// A second modal opened from the first, e.g. a confirmation after a choice.
export const InNestedDialog: Story = {
  render: () => <DialogExample nested />,
};
