import { expect, test } from "vitest";

import { compare, countPatterns } from "./design-ratchet.mjs";

const file = (path, content) => ({ path, content });

test("counts each pattern in the files it applies to", () => {
  const counts = countPatterns(
    [
      file(
        "apps/marketing/src/app/page.tsx",
        '<p className="text-[13px] text-sm">x</p><button>y</button>',
      ),
      file(
        "packages/ui/src/button.tsx",
        "<button className='text-[1.05rem]' />",
      ),
    ],
    {},
  );
  expect(counts["arbitrary-text"]).toBe(2);
  expect(counts["raw-text-size"]).toBe(1);
  // Raw buttons only count in apps: the package is where the button primitive lives.
  expect(counts["raw-button"]).toBe(1);
});

test("stories and tests are not counted", () => {
  const counts = countPatterns(
    [
      file("packages/ui/src/button.stories.tsx", 'className="text-[9px]"'),
      file("apps/marketing/src/lib/x.test.mts", 'const c = "#ff0000";'),
    ],
    {},
  );
  expect(counts["arbitrary-text"]).toBe(0);
  expect(counts["hex-color"]).toBe(0);
});

test("allow-listed files are exempt for their pattern only", () => {
  const counts = countPatterns(
    [file("apps/marketing/src/app/layout.tsx", 'color: "#faf6f0" text-[2px]')],
    {
      "hex-color": [
        {
          file: "apps/marketing/src/app/layout.tsx",
          reason: "theme-color meta",
        },
      ],
    },
  );
  expect(counts["hex-color"]).toBe(0);
  expect(counts["arbitrary-text"]).toBe(1);
});

test("anchors are not hex colours", () => {
  const counts = countPatterns(
    [
      file(
        "apps/marketing/src/lib/routes.ts",
        '"/faecher#faq" "#but" "#discord"',
      ),
    ],
    {},
  );
  expect(counts["hex-color"]).toBe(0);
});

test("counts the colour, shadow, radius, clamp and inline-style patterns", () => {
  const counts = countPatterns(
    [
      file(
        "apps/marketing/src/components/hero-card.tsx",
        `<div
  className="shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-[20px] rounded-t-[8px] py-[clamp(1rem,2vw,2rem)]"
  style={{ background: "color-mix(in srgb, red 50%, blue)" }}
/>`,
      ),
    ],
    {},
  );
  expect(counts["color-mix"]).toBe(1);
  expect(counts["arbitrary-shadow"]).toBe(1);
  // Both the bare and the `-t-` form of the radius pattern are exercised.
  expect(counts["arbitrary-radius"]).toBe(2);
  expect(counts["clamp-spacing"]).toBe(1);
  expect(counts["inline-style"]).toBe(1);
});

test("a rise and a drop are both reported", () => {
  expect(compare({ a: 3, b: 1 }, { a: 2, b: 2 })).toEqual({
    raised: ["a"],
    lowered: ["b"],
  });
  expect(compare({ a: 2 }, { a: 2 })).toEqual({ raised: [], lowered: [] });
});
