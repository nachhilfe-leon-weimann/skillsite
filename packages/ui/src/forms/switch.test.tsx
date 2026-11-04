import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { useState } from "react";

import { Switch } from "./switch";

afterEach(cleanup);

beforeAll(() => {
  // Radix's `Root` measures the switch for its native input (only `Root`,
  // used as the red probe, does); jsdom has no observer.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

/** A controlled switch named by its label, inside a form. */
function Controlled({
  initial = false,
  disabled,
  onChange,
  onSubmit,
  onFormClick,
  preventSwitchClicks,
}: {
  initial?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  onSubmit?: () => void;
  onFormClick?: (target: EventTarget) => void;
  /** An ancestor that prevents the default of clicks on the switch. */
  preventSwitchClicks?: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      onClick={(event) => onFormClick?.(event.target)}
      onClickCapture={(event) => {
        if (
          preventSwitchClicks &&
          (event.target as Element).closest("[role=switch]")
        )
          event.preventDefault();
      }}
    >
      <Switch
        id="reminder"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => {
          onChange?.(next);
          setChecked(next);
        }}
      />
      <label htmlFor="reminder">Erinnerung</label>
      <button type="button" onClick={() => setChecked((value) => !value)}>
        Von außen
      </button>
      <button type="reset">Zurücksetzen</button>
    </form>
  );
}

const theSwitch = () => screen.getByRole("switch", { name: "Erinnerung" });

test("is a named switch that announces its state", () => {
  render(<Controlled />);
  expect(theSwitch().tagName).toBe("BUTTON");
  expect(theSwitch()).toHaveProperty("type", "button");
  expect(theSwitch().getAttribute("aria-checked")).toBe("false");
  cleanup();
  render(<Controlled initial />);
  expect(theSwitch().getAttribute("aria-checked")).toBe("true");
});

test("takes its name from aria-label or aria-labelledby", () => {
  render(
    <>
      <Switch checked={false} aria-label="Ohne sichtbaren Text" />
      <span id="visible">Sichtbarer Text</span>
      <Switch checked aria-labelledby="visible" />
    </>,
  );
  expect(
    screen
      .getByRole("switch", { name: "Ohne sichtbaren Text" })
      .getAttribute("aria-checked"),
  ).toBe("false");
  expect(
    screen
      .getByRole("switch", { name: "Sichtbarer Text" })
      .getAttribute("aria-checked"),
  ).toBe("true");
});

test("a click asks for the other state once", () => {
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  fireEvent.click(theSwitch());
  expect(onChange.mock.calls).toEqual([[true]]);
  expect(theSwitch().getAttribute("aria-checked")).toBe("true");
  fireEvent.click(theSwitch());
  expect(onChange.mock.calls).toEqual([[true], [false]]);
  expect(theSwitch().getAttribute("aria-checked")).toBe("false");
});

test("a controlled switch shows only the state it is given", () => {
  const onChange = vi.fn();
  const { rerender } = render(
    <Switch checked={false} aria-label="Fest" onCheckedChange={onChange} />,
  );
  const element = screen.getByRole("switch", { name: "Fest" });
  fireEvent.click(element);
  fireEvent.click(element);
  // The parent did not take the change: both clicks ask for "on".
  expect(onChange.mock.calls).toEqual([[true], [true]]);
  expect(element.getAttribute("aria-checked")).toBe("false");
  rerender(<Switch checked aria-label="Fest" onCheckedChange={onChange} />);
  expect(element.getAttribute("aria-checked")).toBe("true");
  expect(onChange).toHaveBeenCalledTimes(2);
});

test("an external change updates the switch without a change callback", () => {
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Von außen" }));
  expect(theSwitch().getAttribute("aria-checked")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Von außen" }));
  expect(theSwitch().getAttribute("aria-checked")).toBe("false");
  expect(onChange).not.toHaveBeenCalled();
});

test("its label toggles it once", () => {
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  fireEvent.click(screen.getByText("Erinnerung"));
  expect(onChange.mock.calls).toEqual([[true]]);
  expect(theSwitch().getAttribute("aria-checked")).toBe("true");
});

test("a disabled switch cannot change", () => {
  const onChange = vi.fn();
  render(<Controlled disabled onChange={onChange} />);
  expect(theSwitch()).toHaveProperty("disabled", true);
  fireEvent.click(theSwitch());
  fireEvent.click(screen.getByText("Erinnerung"));
  expect(onChange).not.toHaveBeenCalled();
  expect(theSwitch().getAttribute("aria-checked")).toBe("false");
});

test("in a form it is a single button that never submits", () => {
  const onSubmit = vi.fn();
  const onFormClick = vi.fn();
  const { container } = render(
    <Controlled onSubmit={onSubmit} onFormClick={onFormClick} />,
  );
  // No hidden native checkbox beside the button.
  expect(container.querySelectorAll("input")).toHaveLength(0);
  expect(theSwitch().nextElementSibling?.tagName).toBe("LABEL");
  fireEvent.click(theSwitch());
  expect(onSubmit).not.toHaveBeenCalled();
  // The form sees the click once, from the switch itself.
  expect(onFormClick.mock.calls).toEqual([[theSwitch()]]);
});

test("a form reset leaves the switch to its parent", () => {
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  fireEvent.click(theSwitch());
  expect(onChange).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(theSwitch().getAttribute("aria-checked")).toBe("true");
  // The next click still asks for a change.
  fireEvent.click(theSwitch());
  expect(onChange.mock.calls).toEqual([[true], [false]]);
});

test("a click whose default an ancestor prevented toggles once; a reset then changes nothing", () => {
  const onChange = vi.fn();
  render(<Controlled preventSwitchClicks onChange={onChange} />);
  // An outside change, so a reset to the first rendered state would show.
  fireEvent.click(screen.getByRole("button", { name: "Von außen" }));
  fireEvent.click(theSwitch());
  // As before, the switch's click asks for the other state.
  expect(onChange.mock.calls).toEqual([[false]]);
  fireEvent.click(screen.getByRole("button", { name: "Von außen" }));
  expect(theSwitch().getAttribute("aria-checked")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));
  expect(onChange.mock.calls).toEqual([[false]]);
  expect(theSwitch().getAttribute("aria-checked")).toBe("true");
});

test("passes its id to the button and hides the thumb", () => {
  render(<Controlled />);
  expect(theSwitch().id).toBe("reminder");
  const thumb = theSwitch().firstElementChild!;
  expect(thumb.getAttribute("aria-hidden")).toBe("true");
  expect(theSwitch().textContent).toBe("");
});
