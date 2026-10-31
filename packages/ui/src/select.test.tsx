import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Select } from "./select";

afterEach(cleanup);

const options = [{ value: 60, label: "60 Minuten" }];

test("a hidden label still names the trigger and the list", () => {
  render(
    <Select
      label="Dauer"
      hideLabel
      value={60}
      options={options}
      onChange={() => {}}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Dauer: 60 Minuten" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("listbox", { hidden: true, name: "Dauer" }),
  ).toBeTruthy();
  expect(screen.queryByText("Dauer")).toBeNull();
});

test("a visible label is shown above the value", () => {
  render(
    <Select label="Dauer" value={60} options={options} onChange={() => {}} />,
  );
  expect(screen.getByText("Dauer")).toBeTruthy();
});
