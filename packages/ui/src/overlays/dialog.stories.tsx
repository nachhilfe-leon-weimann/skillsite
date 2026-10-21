import { useId, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Dialog } from "./dialog";
import { Button } from "../primitives/button";

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
  args: { open: false, onClose: () => {}, children: null },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

function Example({
  custom = false,
  focusMode = "opener",
}: {
  custom?: boolean;
  focusMode?: "opener" | "target" | "navigation";
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [opener, setOpener] = useState("visible");
  const [closes, setCloses] = useState(0);
  const [updates, setUpdates] = useState(0);
  const [nested, setNested] = useState(false);
  const fallback = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const close = () => {
    setOpen(false);
    setCloses((count) => count + 1);
  };
  return (
    <div className="space-y-4 p-6">
      <h2 ref={fallback} tabIndex={-1} className="text-h4">
        Dialogbeispiele
      </h2>
      {opener !== "removed" && (
        <Button
          hidden={opener === "hidden"}
          disabled={opener === "disabled"}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => {
            setMounted(true);
            setOpen(true);
          }}
        >
          Dialog öffnen
        </Button>
      )}
      <Button variant="outline">Hintergrundaktion</Button>
      <p role="status">Schließereignisse: {closes}</p>
      {mounted && (
        <Dialog
          open={open}
          onClose={close}
          id={id}
          labelledBy={`${id}-title`}
          describedBy={`${id}-description`}
          fallbackFocusRef={fallback}
          returnFocusRef={focusMode === "target" ? fallback : undefined}
          onCloseAutoFocus={
            focusMode === "navigation"
              ? (event) => {
                  event.preventDefault();
                  fallback.current?.focus();
                }
              : undefined
          }
          layout={custom ? "custom" : "panel"}
          className={
            custom ? "flex flex-col gap-4 overflow-y-auto bg-bg p-6" : undefined
          }
        >
          <h2 id={`${id}-title`} className="text-h4">
            {custom ? "Vollflächiger Dialog" : "Deine Angaben"}
          </h2>
          <p id={`${id}-description`} className="text-small text-ink-soft">
            Prüfe deine Angaben vor dem Schließen.
          </p>
          <label className="block text-body">
            Vorname
            <input className="block rounded-lg border border-line p-2" />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setUpdates((count) => count + 1)}>
              Fokus halten ({updates})
            </Button>
            <Button onClick={() => setOpen(false)}>Extern schließen</Button>
            <Button onClick={() => setMounted(false)}>Dialog entfernen</Button>
            <Button onClick={() => setOpener("removed")}>
              Auslöser entfernen
            </Button>
            <Button onClick={() => setOpener("hidden")}>
              Auslöser ausblenden
            </Button>
            <Button onClick={() => setOpener("disabled")}>
              Auslöser deaktivieren
            </Button>
            <Button onClick={() => setNested(true)}>
              Zweiten Dialog öffnen
            </Button>
            <Button onClick={close}>Schließen</Button>
          </div>
          <Dialog
            open={nested}
            onClose={() => setNested(false)}
            labelledBy={`${id}-nested-title`}
          >
            <h2 id={`${id}-nested-title`} className="text-h4">
              Zweiter Dialog
            </h2>
            <Button onClick={() => setNested(false)}>Zurück</Button>
          </Dialog>
        </Dialog>
      )}
    </div>
  );
}

export const Default: Story = { render: () => <Example /> };
export const CustomLayout: Story = { render: () => <Example custom /> };

// Explicit destinations and navigation may override the default opener restoration.
export const ExplicitFocusReturn: Story = {
  render: () => <Example focusMode="target" />,
};
export const NavigationFocus: Story = {
  render: () => <Example focusMode="navigation" />,
};
