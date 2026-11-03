import { expect, test } from "vitest";

import { cn } from "./utils";

test("the later of two conflicting utilities wins", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});

test("falsy inputs are dropped", () => {
  expect(cn("a", false, undefined, null, "b")).toBe("a b");
});
