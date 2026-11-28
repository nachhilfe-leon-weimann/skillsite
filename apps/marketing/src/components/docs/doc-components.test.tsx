/**
 * The document shell (spec `docs/specs/documents.md`, "Frontmatter"): the
 * frontmatter flag `sections.nav` alone decides whether a page lists its
 * sections, so an empty list renders no navigation, just like no list.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { DocShell } from "./doc-components";

const shell = (sections?: { id: string; label: string }[]) =>
  new DOMParser().parseFromString(
    renderToStaticMarkup(
      <DocShell hero={<h1>Titel</h1>} sections={sections}>
        <p>Text</p>
      </DocShell>,
    ),
    "text/html",
  );

test.each([
  ["no list", undefined],
  ["an empty list", []],
])(
  "a shell given %s renders no aside and no two-column grid",
  (_, sections) => {
    const page = shell(sections);
    expect(page.querySelector("aside")).toBeNull();
    expect(page.body.innerHTML).not.toContain("lg:grid-cols-");
  },
);

test("a shell given sections lists them in an aside beside the article", () => {
  const page = shell([{ id: "erster", label: "Erster" }]);
  expect(page.querySelector("aside")?.textContent).toContain("Erster");
  expect(page.body.innerHTML).toContain("lg:grid-cols-");
});
