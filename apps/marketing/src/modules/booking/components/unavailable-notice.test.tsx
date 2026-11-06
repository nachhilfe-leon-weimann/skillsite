import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { UnavailableNotice } from "./unavailable-notice";

afterEach(cleanup);

const noFocus = () => ({ current: false });

test("when the times could not be loaded, “Erneut versuchen” asks again once per click", () => {
  const onRetry = vi.fn();
  render(
    <UnavailableNotice
      status="error"
      onRetry={onRetry}
      takeFocusRef={noFocus()}
    />,
  );
  expect(
    screen.getByRole("heading", {
      name: "Termine konnten nicht geladen werden",
    }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("link")).toBeNull();
});

test("without online booking, the notice leads to the contact page instead", () => {
  render(
    <UnavailableNotice
      status="unconfigured"
      onRetry={() => {}}
      takeFocusRef={noFocus()}
    />,
  );
  expect(
    screen.getByRole("heading", {
      name: "Online-Terminwahl gerade nicht verfügbar",
    }),
  ).toBeDefined();
  expect(
    screen.getByRole("link", { name: "Direkt anfragen" }).getAttribute("href"),
  ).toBe("/kontakt");
  expect(screen.queryByRole("button")).toBeNull();
});
