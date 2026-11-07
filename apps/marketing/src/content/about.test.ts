import { expect, test } from "vitest";

import { aboutPage } from "./about";

test("each tab-completed word of the code sample is typed in part, then completed", () => {
  for (const { word, typed } of [aboutPage.code.param, aboutPage.code.check]) {
    expect(typed, word).not.toBe("");
    expect(word.startsWith(typed), `${word} starts with ${typed}`).toBe(true);
    expect(typed.length, word).toBeLessThan(word.length);
  }
});
