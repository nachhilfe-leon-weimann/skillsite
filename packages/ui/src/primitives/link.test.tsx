import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { ArrowLink, NavLink, SmartLink, TextLink } from "./link";

// next/link renders an <a> too: the mock marks it, so a route rendered as a
// plain anchor (a full page load) fails the attribute checks below.
vi.mock("next/link", () => ({
  default: (props: React.ComponentProps<"a">) => (
    <a data-next-link="" {...props} />
  ),
}));

afterEach(cleanup);

test("the link rule: routes, web addresses and plain anchors", () => {
  render(
    <>
      <SmartLink href="/preise">Preise</SmartLink>
      <SmartLink href="https://discord.gg/x">Discord</SmartLink>
      <SmartLink href="mailto:a@b.de">E-Mail</SmartLink>
      <SmartLink href="tel:+49">Telefon</SmartLink>
      <SmartLink href="#kontakt">Abschnitt</SmartLink>
    </>,
  );
  const link = (name: string) => screen.getByRole("link", { name });
  const attributes = (name: string) =>
    [...link(name).attributes].map((a) => `${a.name}=${a.value}`).sort();
  expect(attributes("Preise")).toEqual(["data-next-link=", "href=/preise"]);
  expect(attributes("Discord")).toEqual([
    "href=https://discord.gg/x",
    "rel=noopener noreferrer",
    "target=_blank",
  ]);
  expect(attributes("E-Mail")).toEqual(["href=mailto:a@b.de"]);
  expect(attributes("Telefon")).toEqual(["href=tel:+49"]);
  expect(attributes("Abschnitt")).toEqual(["href=#kontakt"]);
});

test("TextLink variants keep the measured looks", () => {
  render(
    <>
      <TextLink href="mailto:a@b.de">Inline</TextLink>
      <TextLink variant="doc" href="#a">
        Doc
      </TextLink>
      <TextLink variant="inverse" href="/kontakt">
        Kontakt
      </TextLink>
    </>,
  );
  expect(screen.getByRole("link", { name: "Inline" }).className).toBe(
    "font-medium text-coral underline transition-colors hover:text-coral-2 underline-offset-4",
  );
  expect(screen.getByRole("link", { name: "Doc" }).className).toBe(
    "font-medium text-coral underline transition-colors hover:text-coral-2 underline-offset-[3px]",
  );
  expect(screen.getByRole("link", { name: "Kontakt" }).className).toBe(
    "w-fit text-small text-on-navy-soft transition-colors hover:text-white",
  );
});

test("ArrowLink ends in a decorative arrow after a space", () => {
  render(<ArrowLink href="/kontakt#kennenlernen">Erstgespräch</ArrowLink>);
  const link = screen.getByRole("link", { name: "Erstgespräch" });
  expect(link.hasAttribute("data-next-link")).toBe(true);
  expect(link.className).toBe(
    "font-semibold text-coral underline underline-offset-[3px]",
  );
  expect(link.textContent).toBe("Erstgespräch ");
  expect(link.lastElementChild?.getAttribute("aria-hidden")).toBe("true");
  expect(link.lastElementChild?.getAttribute("class")).toContain(
    "inline size-4",
  );
});

test("NavLink shows the active entry per variant; aria-current is the caller's", () => {
  render(
    <>
      <NavLink href="/preise" active aria-current="page">
        Preise
      </NavLink>
      <NavLink variant="menu-sub" href="/termin">
        Termin
      </NavLink>
      <NavLink variant="toc" href="#a" active>
        Abschnitt
      </NavLink>
    </>,
  );
  const current = screen.getByRole("link", { name: "Preise" });
  expect(current.hasAttribute("data-next-link")).toBe(true);
  expect(current.getAttribute("aria-current")).toBe("page");
  expect(current.className).toBe(
    "border-b border-line py-3 text-body font-semibold text-ink",
  );
  expect(screen.getByRole("link", { name: "Termin" }).className).toBe(
    "border-b border-line py-2.5 pl-4 text-small font-medium text-ink-soft",
  );
  expect(screen.getByRole("link", { name: "Abschnitt" }).className).toBe(
    "block rounded-lg px-2 py-1.5 transition-colors bg-surface-2 font-medium text-ink",
  );
});
