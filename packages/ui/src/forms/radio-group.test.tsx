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

import { RadioGroup, type ChoiceOption } from "./radio-group";

afterEach(cleanup);

beforeAll(() => {
  // Radix sizes the hidden inputs it adds inside a form; jsdom has no observer.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const platforms: ChoiceOption[] = [
  { value: "teams", label: "Microsoft Teams", hint: "Im Browser oder als App" },
  { value: "discord", label: "Discord" },
  { value: "zoom", label: "Zoom" },
];

function Controlled({
  initial = "",
  options = platforms,
  onChange,
  required,
  disabled,
}: {
  initial?: string;
  options?: ChoiceOption[];
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <RadioGroup
      label="Plattform"
      options={options}
      value={value}
      required={required}
      disabled={disabled}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
    />
  );
}

const group = () => screen.getByRole("radiogroup", { name: "Plattform" });
const radio = (name: string) => screen.getByRole("radio", { name });
const checked = () =>
  screen
    .getAllByRole("radio")
    .filter((element) => element.getAttribute("aria-checked") === "true")
    .map((element) => element.getAttribute("value"));

/** A key pressed and released at once, before Radix's deferred focus runs. */
function quickPress(key: string) {
  const target = document.activeElement!;
  fireEvent.keyDown(target, { key });
  fireEvent.keyUp(target, { key });
}

async function expectFocusedAndChecked(name: string) {
  await waitFor(() => expect(document.activeElement).toBe(radio(name)));
  await waitFor(() =>
    expect(radio(name).getAttribute("aria-checked")).toBe("true"),
  );
  expect(checked()).toHaveLength(1);
}

test("the group is named by its label; radios by theirs, hints describe them", () => {
  render(<Controlled initial="teams" required />);
  expect(group().getAttribute("aria-required")).toBe("true");
  const teams = radio("Microsoft Teams");
  const description = document.getElementById(
    teams.getAttribute("aria-describedby")!,
  );
  expect(description?.textContent).toBe("Im Browser oder als App");
  expect(radio("Discord").hasAttribute("aria-describedby")).toBe(false);
});

test("an optional group is not marked required", () => {
  render(<Controlled />);
  expect(group().hasAttribute("aria-required")).toBe(false);
});

test("an optional group may start empty; a preselected one checks its value", () => {
  render(<Controlled />);
  expect(checked()).toEqual([]);
  cleanup();
  render(<Controlled initial="discord" />);
  expect(checked()).toEqual(["discord"]);
});

test("quick arrow presses move focus and selection together", async () => {
  const onChange = vi.fn();
  render(<Controlled initial="teams" onChange={onChange} />);
  act(() => radio("Microsoft Teams").focus());

  quickPress("ArrowDown");
  await expectFocusedAndChecked("Discord");
  quickPress("ArrowRight");
  await expectFocusedAndChecked("Zoom");
  // Wraps around, both ways.
  quickPress("ArrowDown");
  await expectFocusedAndChecked("Microsoft Teams");
  quickPress("ArrowUp");
  await expectFocusedAndChecked("Zoom");
  quickPress("ArrowLeft");
  await expectFocusedAndChecked("Discord");
  expect(onChange.mock.calls).toEqual([
    ["discord"],
    ["zoom"],
    ["teams"],
    ["zoom"],
    ["discord"],
  ]);
});

test("two keys pressed before the first focus arrives both check their radio", async () => {
  const onChange = vi.fn();
  render(<Controlled initial="discord" onChange={onChange} />);
  act(() => radio("Discord").focus());
  // Both keys start from Discord: Radix focuses Teams, then Zoom.
  quickPress("ArrowUp");
  quickPress("ArrowDown");
  await expectFocusedAndChecked("Zoom");
  expect(onChange.mock.calls).toEqual([["teams"], ["zoom"]]);
});

test("a key whose focus arrives after focus went elsewhere still checks that radio", async () => {
  const onChange = vi.fn();
  render(
    <>
      <Controlled initial="teams" onChange={onChange} />
      <button type="button">Danach</button>
    </>,
  );
  act(() => radio("Microsoft Teams").focus());
  quickPress("ArrowDown");
  // Before Radix's deferred focus runs, focus moves on; Radix then takes it back.
  act(() => screen.getByRole("button", { name: "Danach" }).focus());
  await expectFocusedAndChecked("Discord");
  expect(onChange.mock.calls).toEqual([["discord"]]);
});

test("Home on the focused first radio of an empty group checks it", async () => {
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  act(() => group().focus());
  await waitFor(() =>
    expect(document.activeElement).toBe(radio("Microsoft Teams")),
  );
  quickPress("Home");
  await expectFocusedAndChecked("Microsoft Teams");
  expect(onChange.mock.calls).toEqual([["teams"]]);
});

test("a held arrow key moves focus and selection together, once per step", async () => {
  const onChange = vi.fn();
  render(<Controlled initial="teams" onChange={onChange} />);
  act(() => radio("Microsoft Teams").focus());

  fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
  await expectFocusedAndChecked("Discord");
  fireEvent.keyDown(document.activeElement!, {
    key: "ArrowDown",
    repeat: true,
  });
  await expectFocusedAndChecked("Zoom");
  fireEvent.keyUp(document.activeElement!, { key: "ArrowDown" });
  await act(async () => {});
  expect(onChange.mock.calls).toEqual([["discord"], ["zoom"]]);
});

test("Home and End move focus and selection to the first and last radio", async () => {
  const onChange = vi.fn();
  render(<Controlled initial="discord" onChange={onChange} />);
  act(() => radio("Discord").focus());

  quickPress("End");
  await expectFocusedAndChecked("Zoom");
  quickPress("Home");
  await expectFocusedAndChecked("Microsoft Teams");
  expect(onChange.mock.calls).toEqual([["zoom"], ["teams"]]);
});

test("a modified arrow key moves nothing", async () => {
  const onChange = vi.fn();
  render(<Controlled initial="teams" onChange={onChange} />);
  act(() => radio("Microsoft Teams").focus());
  fireEvent.keyDown(document.activeElement!, {
    key: "ArrowDown",
    shiftKey: true,
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(document.activeElement).toBe(radio("Microsoft Teams"));
  expect(onChange).not.toHaveBeenCalled();
});

test("activating the checked radio again keeps it checked", async () => {
  const onChange = vi.fn();
  render(<Controlled initial="teams" onChange={onChange} />);
  fireEvent.click(radio("Microsoft Teams"));
  act(() => radio("Microsoft Teams").focus());
  fireEvent.keyDown(radio("Microsoft Teams"), { key: "Enter" });
  await act(async () => {});
  expect(checked()).toEqual(["teams"]);
  expect(onChange).not.toHaveBeenCalled();
});

test("Enter and a click check an unchecked radio", async () => {
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  act(() => radio("Discord").focus());
  fireEvent.keyDown(radio("Discord"), { key: "Enter" });
  await waitFor(() => expect(checked()).toEqual(["discord"]));
  fireEvent.click(radio("Zoom"));
  await waitFor(() => expect(checked()).toEqual(["zoom"]));
  expect(onChange.mock.calls).toEqual([["discord"], ["zoom"]]);
});

test("focus entering an empty group checks nothing", async () => {
  const onChange = vi.fn();
  render(<Controlled onChange={onChange} />);
  act(() => group().focus());
  await waitFor(() =>
    expect(document.activeElement).toBe(radio("Microsoft Teams")),
  );
  await act(async () => {});
  expect(checked()).toEqual([]);
  expect(onChange).not.toHaveBeenCalled();
});

test("only the focused radio is a tab stop", async () => {
  render(<Controlled initial="teams" />);
  act(() => radio("Microsoft Teams").focus());
  quickPress("ArrowDown");
  await expectFocusedAndChecked("Discord");
  const stops = screen
    .getAllByRole("radio")
    .filter((element) => element.tabIndex === 0)
    .map((element) => element.getAttribute("value"));
  expect(stops).toEqual(["discord"]);
});

test("disabled radios are skipped and cannot be checked", async () => {
  const onChange = vi.fn();
  const options = platforms.map((option) =>
    option.value === "discord" ? { ...option, disabled: true } : option,
  );
  render(<Controlled initial="teams" options={options} onChange={onChange} />);
  expect((radio("Discord") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(radio("Discord"));
  act(() => radio("Microsoft Teams").focus());
  quickPress("ArrowDown");
  await expectFocusedAndChecked("Zoom");
  expect(onChange.mock.calls).toEqual([["zoom"]]);
});

test("a disabled group cannot change", () => {
  const onChange = vi.fn();
  render(<Controlled initial="teams" disabled onChange={onChange} />);
  for (const element of screen.getAllByRole("radio"))
    expect((element as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(radio("Zoom"));
  expect(checked()).toEqual(["teams"]);
  expect(onChange).not.toHaveBeenCalled();
});

test("inside a form, nothing submits it and Radix's hidden inputs add no validation", async () => {
  const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
  render(
    <form onSubmit={onSubmit}>
      <Controlled initial="teams" required />
    </form>,
  );
  const inputs =
    document.querySelectorAll<HTMLInputElement>("input[type=radio]");
  expect(inputs).toHaveLength(3);
  for (const input of inputs) {
    expect(input.required).toBe(false);
    expect(input.name).toBe("");
    expect(input.tabIndex).toBe(-1);
  }
  fireEvent.click(radio("Discord"));
  act(() => radio("Discord").focus());
  fireEvent.keyDown(radio("Discord"), { key: "Enter" });
  quickPress("ArrowDown");
  await expectFocusedAndChecked("Zoom");
  expect(onSubmit).not.toHaveBeenCalled();
});
