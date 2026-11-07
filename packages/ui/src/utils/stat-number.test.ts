import { expect, test } from "vitest";

import { formatStatNumber, parseStatNumber } from "./stat-number";

/** Shows a stat the way CountUp does once counting ends. */
function settled(value: string) {
  const stat = parseStatNumber(value);
  if (!stat) return null;
  return stat.prefix + formatStatNumber(stat.to, stat) + stat.suffix;
}

/** Shows the number of a stat as CountUp does while it counts towards it. */
function counting(value: string, current: number) {
  const stat = parseStatNumber(value);
  if (!stat) throw new Error(`"${value}" holds no number`);
  return formatStatNumber(current, stat);
}

test("a stat ends on exactly the value it was given", () => {
  for (const value of [
    "320+",
    "35+",
    "3",
    "30 €",
    "€ 45",
    "4,8",
    "1.200+",
    "1.234,56",
    "0,5",
  ]) {
    expect(settled(value), value).toBe(value);
  }
});

test("a decimal keeps its comma while it counts", () => {
  expect(counting("4,8", 2.43)).toBe("2,4");
  expect(counting("4,8", 0)).toBe("0,0");
});

test("a thousands value keeps its dot while it counts", () => {
  expect(counting("1.200+", 345.2)).toBe("345");
  expect(counting("1.200+", 1034.7)).toBe("1.035");
  expect(counting("1.234,56", 1000.5)).toBe("1.000,50");
});

test("a value without a dot counts without one", () => {
  expect(counting("1200", 1034)).toBe("1034");
});

test("a value that is no German number has nothing to count", () => {
  for (const value of ["24/7", "1.5", "1,2,3", "007", "Fächer"]) {
    expect(parseStatNumber(value), value).toBeNull();
  }
});
