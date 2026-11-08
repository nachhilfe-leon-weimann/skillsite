import { expect, test } from "vitest";

import { aboutPage, type TabCompletion } from "./about";

/** Every value of the code content shaped like a tab-completed word. */
const tabCompletions = Object.entries(aboutPage.code).filter(
  (entry): entry is [string, TabCompletion] => {
    const value: unknown = entry[1];
    return (
      typeof value === "object" &&
      value !== null &&
      "word" in value &&
      "typed" in value
    );
  },
);

test("the code sample has tab-completed words", () => {
  expect(tabCompletions.length).toBeGreaterThan(0);
});

test.each(tabCompletions)(
  "the tab-completed word %s is typed in part, then completed",
  (_name, { word, typed }) => {
    expect(typed, word).not.toBe("");
    expect(word.startsWith(typed), `${word} starts with ${typed}`).toBe(true);
    expect(typed.length, word).toBeLessThan(word.length);
  },
);
