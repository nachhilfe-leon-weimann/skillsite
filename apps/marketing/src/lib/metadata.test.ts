import { expect, test } from "vitest";

import { pageMetadata, siteMetadata } from "./metadata";

test("the site defaults declare no canonical", () => {
  expect(siteMetadata.alternates).toBeUndefined();
});

test("home gets its canonical and og:url and keeps the site card", () => {
  const metadata = pageMetadata({ home: true });
  expect(metadata.alternates).toEqual({ canonical: "/" });
  expect(metadata.title).toBeUndefined();
  expect(metadata.openGraph).toEqual({ ...siteMetadata.openGraph, url: "/" });
  expect(metadata.twitter).toBeUndefined();
});

test("a listed page echoes its copy into the social card", () => {
  const metadata = pageMetadata({
    title: "Preise",
    description: "Was eine Stunde kostet.",
    canonical: "/preise",
  });
  expect(metadata.alternates).toEqual({ canonical: "/preise" });
  expect(metadata.openGraph).toMatchObject({
    url: "/preise",
    title: "Preise – Nachhilfe Leon Weimann",
    description: "Was eine Stunde kostet.",
  });
  expect(metadata.twitter).toMatchObject({
    title: "Preise – Nachhilfe Leon Weimann",
  });
});

test("an unlisted page has no canonical, is noindex and keeps the site card", () => {
  const metadata = pageMetadata({ title: "Rechnung bezahlen", unlisted: true });
  expect(metadata).toEqual({
    title: "Rechnung bezahlen",
    robots: { index: false, follow: false },
  });
});
