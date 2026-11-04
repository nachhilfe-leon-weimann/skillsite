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
import { Calculator, FlaskConical } from "lucide-react";

import { ChoiceChips } from "./choice-chips";
import type { ChoiceOption } from "./radio-group";

afterEach(cleanup);

beforeAll(() => {
  // Radix sizes the hidden inputs it adds inside a form; jsdom has no observer.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const subjects: ChoiceOption[] = [
  { value: "Mathe", label: "Mathe", icon: Calculator },
  { value: "Physik", label: "Physik", icon: FlaskConical },
  { value: "Informatik", label: "Informatik" },
];

function Single({
  initial = "",
  options = subjects,
  onChange,
}: {
  initial?: string;
  options?: ChoiceOption[];
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ChoiceChips
      label="Fach"
      required
      options={options}
      value={value}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
    />
  );
}

function Multiple({
  initial = [],
  options = subjects,
  onChange,
}: {
  initial?: string[];
  options?: ChoiceOption[];
  onChange?: (value: string[]) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ChoiceChips
      multiple
      label="Fächer"
      required
      options={options}
      value={value}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
    />
  );
}

const chip = (name: string) => screen.getByRole("button", { name });
const radio = (name: string) => screen.getByRole("radio", { name });

test("single chips are a named, required radio group of named radios", () => {
  render(<Single />);
  const group = screen.getByRole("radiogroup", { name: "Fach" });
  expect(group.getAttribute("aria-required")).toBe("true");
  expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual([
    "Mathe",
    "Physik",
    "Informatik",
  ]);
  // Icons are decoration.
  for (const icon of group.querySelectorAll("svg"))
    expect(icon.closest("[aria-hidden=true]")).not.toBeNull();
});

test("a single chip may start empty; activating the checked chip keeps it", async () => {
  const onChange = vi.fn();
  render(<Single onChange={onChange} />);
  expect(
    screen
      .getAllByRole("radio")
      .filter((r) => r.getAttribute("aria-checked") === "true"),
  ).toEqual([]);
  fireEvent.click(radio("Physik"));
  await waitFor(() =>
    expect(radio("Physik").getAttribute("aria-checked")).toBe("true"),
  );
  // Before, a second click cleared the choice.
  fireEvent.click(radio("Physik"));
  act(() => radio("Physik").focus());
  fireEvent.keyDown(radio("Physik"), { key: "Enter" });
  await act(async () => {});
  expect(radio("Physik").getAttribute("aria-checked")).toBe("true");
  expect(onChange.mock.calls).toEqual([["Physik"]]);
});

test("quick arrow presses move a single chip's focus and choice together", async () => {
  const onChange = vi.fn();
  render(<Single initial="Mathe" onChange={onChange} />);
  act(() => radio("Mathe").focus());
  for (const [key, name] of [
    ["ArrowRight", "Physik"],
    ["ArrowRight", "Informatik"],
    ["ArrowLeft", "Physik"],
  ] as const) {
    const target = document.activeElement!;
    fireEvent.keyDown(target, { key });
    fireEvent.keyUp(target, { key });
    await waitFor(() => expect(document.activeElement).toBe(radio(name)));
    await waitFor(() =>
      expect(radio(name).getAttribute("aria-checked")).toBe("true"),
    );
  }
  expect(onChange.mock.calls).toEqual([["Physik"], ["Informatik"], ["Physik"]]);
});

test("multiple chips are a named group of independent pressed toggles", () => {
  render(<Multiple initial={["Physik"]} />);
  const group = screen.getByRole("group", { name: "Fächer" });
  // ARIA has no required state for a group; browsers ignored it.
  expect(group.hasAttribute("aria-required")).toBe(false);
  expect(screen.queryByRole("toolbar")).toBeNull();
  expect(
    screen
      .getAllByRole("button")
      .map((button) => [
        button.textContent,
        button.getAttribute("aria-pressed"),
      ]),
  ).toEqual([
    ["Mathe", "false"],
    ["Physik", "true"],
    ["Informatik", "false"],
  ]);
  // Each chip stays a tab stop.
  for (const button of screen.getAllByRole("button"))
    expect(button.tabIndex).toBe(0);
});

test("multiple chips select and deselect independently, in pressing order", async () => {
  const onChange = vi.fn();
  render(<Multiple onChange={onChange} />);
  fireEvent.click(chip("Informatik"));
  await waitFor(() =>
    expect(chip("Informatik").getAttribute("aria-pressed")).toBe("true"),
  );
  fireEvent.click(chip("Mathe"));
  await waitFor(() =>
    expect(chip("Mathe").getAttribute("aria-pressed")).toBe("true"),
  );
  fireEvent.click(chip("Informatik"));
  await waitFor(() =>
    expect(chip("Informatik").getAttribute("aria-pressed")).toBe("false"),
  );
  fireEvent.click(chip("Informatik"));
  await waitFor(() =>
    expect(chip("Informatik").getAttribute("aria-pressed")).toBe("true"),
  );
  expect(onChange.mock.calls).toEqual([
    [["Informatik"]],
    [["Informatik", "Mathe"]],
    [["Mathe"]],
    [["Mathe", "Informatik"]],
  ]);
});

test("arrow keys do not move between multiple chips", async () => {
  render(<Multiple />);
  act(() => chip("Mathe").focus());
  fireEvent.keyDown(chip("Mathe"), { key: "ArrowRight" });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(document.activeElement).toBe(chip("Mathe"));
});

test("disabled chips cannot change", async () => {
  const onChange = vi.fn();
  const options = subjects.map((option) =>
    option.value === "Physik" ? { ...option, disabled: true } : option,
  );
  render(<Multiple options={options} onChange={onChange} />);
  expect((chip("Physik") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(chip("Physik"));
  cleanup();
  render(<Single options={options} onChange={onChange} />);
  expect((radio("Physik") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(radio("Physik"));
  await act(async () => {});
  expect(onChange).not.toHaveBeenCalled();
});
