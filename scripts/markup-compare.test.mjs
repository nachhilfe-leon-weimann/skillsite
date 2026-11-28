import { expect, test } from "vitest";

import { normalizeHtml } from "./markup-compare.mjs";

test("prints one element per line, indented by depth, from <html> on", () => {
  expect(
    normalizeHtml(
      '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><title>AGB</title></head><body><main><p>Text</p><br/></main></body></html>',
    ),
  ).toBe(
    [
      '<html lang="de">',
      "  <head>",
      '    <meta charset="utf-8"/>',
      "    <title>",
      '      "AGB"',
      "    </title>",
      "  </head>",
      "  <body>",
      "    <main>",
      "      <p>",
      '        "Text"',
      "      </p>",
      "      <br/>",
      "    </main>",
      "  </body>",
      "</html>",
      "",
    ].join("\n"),
  );
});

test("drops scripts and comments, merges the texts they split and collapses whitespace", () => {
  expect(
    normalizeHtml(
      '<html><body><p>Ein<!-- -->  Satz<script>self.__next_f.push([1,"<p>x</p>"])</script>\n mit Pause.</p></body></html>',
    ),
  ).toContain('"Ein Satz mit Pause."');
});

test("JSON-LD structured data stays, as page content", () => {
  expect(
    normalizeHtml(
      '<html><body><script type="application/ld+json">{"name":"Beispiel"}</script><script src="/_next/static/x.js"></script></body></html>',
    ),
  ).toBe(
    [
      "<html>",
      "  <body>",
      '    <script type="application/ld+json">',
      '      "{\\"name\\":\\"Beispiel\\"}"',
      "    </script>",
      "  </body>",
      "</html>",
      "",
    ].join("\n"),
  );
});

test("hashed static URLs become a placeholder, plain and URL-encoded", () => {
  const page = normalizeHtml(
    '<html><head><link rel="stylesheet" href="/_next/static/chunks/0a1b2c.css"/></head><body><img srcset="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffoto.3f4e.webp&amp;w=640 1x"/></body></html>',
  );
  expect(page).toContain('href="/_next/static/…"');
  expect(page).toContain("url=%2F_next%2Fstatic%2F…&amp;w=640");
  expect(page).not.toMatch(/0a1b2c|3f4e/);
});

test("an attribute value may hold a >", () => {
  expect(
    normalizeHtml('<html><body><div title="a > b">x</div></body></html>'),
  ).toContain('    <div title="a > b">\n      "x"\n    </div>');
});
