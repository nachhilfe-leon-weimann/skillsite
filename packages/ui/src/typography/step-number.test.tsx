import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { StepNumber } from "./step-number";

afterEach(cleanup);

test("each size renders its digit size in coral, without extra line height", () => {
  render(
    <>
      <StepNumber size="sm">01</StepNumber>
      <StepNumber size="md">02</StepNumber>
      <StepNumber size="lg">03</StepNumber>
    </>,
  );
  for (const [text, size] of [
    ["01", "sm"],
    ["02", "md"],
    ["03", "lg"],
  ]) {
    expect(screen.getByText(text!).className).toBe(
      `font-heading text-digit-${size} font-extrabold leading-none text-coral`,
    );
  }
});

test("a step number is a span unless another element is named", () => {
  render(
    <>
      <StepNumber size="sm">01</StepNumber>
      <StepNumber size="sm" as="p">
        02
      </StepNumber>
    </>,
  );
  expect(screen.getByText("01").tagName).toBe("SPAN");
  expect(screen.getByText("02").tagName).toBe("P");
});

test("extra classes follow the step number's own", () => {
  render(
    <StepNumber size="lg" className="block">
      01
    </StepNumber>,
  );
  expect(screen.getByText("01").className).toBe(
    "font-heading text-digit-lg font-extrabold leading-none text-coral block",
  );
});
