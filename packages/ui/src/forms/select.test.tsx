import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { useState } from "react";

import { Select, type SelectOption } from "./select";

afterEach(cleanup);

beforeAll(() => {
  // jsdom lacks the layout and pointer-capture APIs the open panel calls.
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
});

const durations = [
  { value: 60, label: "60 Minuten" },
  { value: 90, label: "90 Minuten" },
];

function Controlled<T extends string | number>({
  options,
  initial,
  onChange,
  disabled,
}: {
  options: SelectOption<T>[];
  initial: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Select
      label="Auswahl"
      hideLabel
      value={value}
      options={options}
      disabled={disabled}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
    />
  );
}

const trigger = (name = "Auswahl") => screen.getByRole("combobox", { name });

/** Open with the keyboard and wait for the focused option. */
async function openByKeyboard(name = "Auswahl") {
  const combobox = trigger(name);
  combobox.focus();
  fireEvent.keyDown(combobox, { key: "ArrowDown" });
  const listbox = await screen.findByRole("listbox", { name });
  await waitFor(() =>
    expect(listbox.contains(document.activeElement)).toBe(true),
  );
  return listbox;
}

function focusedOption() {
  return document.activeElement as HTMLElement;
}

test("a hidden label still names the trigger and the list", async () => {
  render(
    <Select
      label="Dauer"
      hideLabel
      value={60}
      options={durations}
      onChange={() => {}}
    />,
  );
  const combobox = trigger("Dauer");
  expect(combobox.textContent).toBe("60 Minuten");
  expect(combobox.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByText("Dauer")).toBeNull();
  const listbox = await openByKeyboard("Dauer");
  expect(combobox.getAttribute("aria-expanded")).toBe("true");
  expect(combobox.getAttribute("aria-controls")).toBe(listbox.id);
});

test("a visible label is shown above the value", () => {
  render(
    <Select label="Dauer" value={60} options={durations} onChange={() => {}} />,
  );
  expect(screen.getByText("Dauer")).toBeTruthy();
  expect(trigger("Dauer").textContent).toBe("Dauer60 Minuten");
});

test("committing a number emits the number once and refocuses the trigger", async () => {
  const onChange = vi.fn();
  render(<Controlled options={durations} initial={60} onChange={onChange} />);
  await openByKeyboard();
  expect(focusedOption().textContent).toBe("60 Minuten");
  expect(focusedOption().getAttribute("aria-selected")).toBe("true");
  fireEvent.keyDown(focusedOption(), { key: "ArrowDown" });
  await waitFor(() => expect(focusedOption().textContent).toBe("90 Minuten"));
  fireEvent.keyDown(focusedOption(), { key: "Enter" });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(90);
  expect(typeof onChange.mock.calls[0]![0]).toBe("number");
  await waitFor(() => expect(document.activeElement).toBe(trigger()));
  expect(trigger().textContent).toBe("90 Minuten");
  expect(trigger().getAttribute("aria-expanded")).toBe("false");
});

test("numeric 1 and string '1' stay distinct options", async () => {
  const onChange = vi.fn();
  const options: SelectOption<number | string>[] = [
    { value: 1, label: "Eins als Zahl" },
    { value: "1", label: "Eins als Text" },
  ];
  render(<Controlled options={options} initial={1} onChange={onChange} />);
  expect(trigger().textContent).toBe("Eins als Zahl");
  await openByKeyboard();
  fireEvent.keyDown(focusedOption(), { key: "ArrowDown" });
  await waitFor(() =>
    expect(focusedOption().textContent).toBe("Eins als Text"),
  );
  fireEvent.keyDown(focusedOption(), { key: "Enter" });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls[0]![0]).toBe("1");
  expect(trigger().textContent).toBe("Eins als Text");

  await openByKeyboard();
  expect(focusedOption().textContent).toBe("Eins als Text");
  fireEvent.keyDown(focusedOption(), { key: "ArrowUp" });
  await waitFor(() =>
    expect(focusedOption().textContent).toBe("Eins als Zahl"),
  );
  fireEvent.keyDown(focusedOption(), { key: "Enter" });
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1]![0]).toBe(1);
});

test("an empty-string option is a valid, selectable value", async () => {
  const onChange = vi.fn();
  const options: SelectOption<string>[] = [
    { value: "", label: "Keine Angabe" },
    { value: "online", label: "Online" },
  ];
  render(<Controlled options={options} initial="online" onChange={onChange} />);
  await openByKeyboard();
  fireEvent.keyDown(focusedOption(), { key: "ArrowUp" });
  await waitFor(() => expect(focusedOption().textContent).toBe("Keine Angabe"));
  fireEvent.keyDown(focusedOption(), { key: "Enter" });
  expect(onChange).toHaveBeenCalledWith("");
  expect(trigger().textContent).toBe("Keine Angabe");
  await openByKeyboard();
  expect(focusedOption().textContent).toBe("Keine Angabe");
  expect(focusedOption().getAttribute("aria-selected")).toBe("true");
});

test("hints describe an option without joining its name, value or typeahead", async () => {
  const onChange = vi.fn();
  const options: SelectOption<string>[] = [
    { value: "mo", label: "Montag", hint: "Mittags frei" },
    { value: "di", label: "Dienstag", hint: "Mittwochs frei" },
    { value: "mi", label: "Mittwoch" },
  ];
  render(<Controlled options={options} initial="mo" onChange={onChange} />);
  expect(trigger().textContent).toBe("Montag");
  const listbox = await openByKeyboard();
  const monday = screen.getByRole("option", { name: "Montag" });
  expect(monday.getAttribute("aria-describedby")).toBeTruthy();
  expect(
    document.getElementById(monday.getAttribute("aria-describedby")!)
      ?.textContent,
  ).toBe("Mittags frei");
  expect(listbox.textContent).toContain("Mittwochs frei");
  // Typeahead on "mi" reaches the label "Mittwoch", not a hint.
  fireEvent.keyDown(focusedOption(), { key: "m" });
  fireEvent.keyDown(focusedOption(), { key: "i" });
  await waitFor(() => expect(focusedOption().textContent).toBe("Mittwoch"));
  fireEvent.keyDown(focusedOption(), { key: "Enter" });
  expect(onChange).toHaveBeenCalledWith("mi");
  expect(trigger().textContent).toBe("Mittwoch");
});

test("typeahead on the closed trigger commits the matching label", async () => {
  const onChange = vi.fn();
  render(<Controlled options={durations} initial={60} onChange={onChange} />);
  trigger().focus();
  fireEvent.keyDown(trigger(), { key: "9" });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(90);
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("an external value change updates the trigger and the selected option", async () => {
  const { rerender } = render(
    <Select
      label="Auswahl"
      hideLabel
      value={60}
      options={durations}
      onChange={() => {}}
    />,
  );
  expect(trigger().textContent).toBe("60 Minuten");
  rerender(
    <Select
      label="Auswahl"
      hideLabel
      value={90}
      options={durations}
      onChange={() => {}}
    />,
  );
  expect(trigger().textContent).toBe("90 Minuten");
  await openByKeyboard();
  expect(focusedOption().textContent).toBe("90 Minuten");
  expect(focusedOption().getAttribute("aria-selected")).toBe("true");
});

test("Escape closes without a change and refocuses the trigger", async () => {
  const onChange = vi.fn();
  render(<Controlled options={durations} initial={60} onChange={onChange} />);
  await openByKeyboard();
  fireEvent.keyDown(focusedOption(), { key: "ArrowDown" });
  await waitFor(() => expect(focusedOption().textContent).toBe("90 Minuten"));
  fireEvent.keyDown(focusedOption(), { key: "Escape" });
  await waitFor(() => expect(document.activeElement).toBe(trigger()));
  expect(onChange).not.toHaveBeenCalled();
  expect(trigger().textContent).toBe("60 Minuten");
  expect(trigger().getAttribute("aria-expanded")).toBe("false");
});

test("committing the current value again is no change", async () => {
  const onChange = vi.fn();
  render(<Controlled options={durations} initial={60} onChange={onChange} />);
  await openByKeyboard();
  fireEvent.keyDown(focusedOption(), { key: "Enter" });
  await waitFor(() => expect(document.activeElement).toBe(trigger()));
  expect(onChange).not.toHaveBeenCalled();
});

test("a disabled select neither opens nor changes", async () => {
  const onChange = vi.fn();
  render(
    <Controlled
      options={durations}
      initial={60}
      onChange={onChange}
      disabled
    />,
  );
  const combobox = trigger();
  expect((combobox as HTMLButtonElement).disabled).toBe(true);
  combobox.focus();
  expect(document.activeElement).not.toBe(combobox);
  fireEvent.keyDown(combobox, { key: "ArrowDown" });
  fireEvent.click(combobox);
  await act(async () => {});
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

test("a closing panel is inert at once and leaves the accessibility tree", async () => {
  render(<Controlled options={durations} initial={60} />);
  const listbox = await openByKeyboard();
  fireEvent.keyDown(focusedOption(), { key: "Escape" });
  // The exit transition may keep the node; it is no longer interactive.
  await waitFor(() => expect(document.activeElement).toBe(trigger()));
  if (listbox.isConnected) {
    expect(listbox.closest("[inert]")).not.toBeNull();
    expect(listbox.style.pointerEvents).toBe("none");
  }
  expect(screen.queryByRole("listbox")).toBeNull();
});
