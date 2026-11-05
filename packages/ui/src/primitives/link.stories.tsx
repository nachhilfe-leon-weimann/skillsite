import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArrowLink, NavLink, SmartLink, TextLink } from "./link";
import { ProseP } from "../typography/prose";
import { Text } from "../typography/text";

const meta = {
  title: "Primitives/Link",
  component: SmartLink,
  args: { href: "/preise", children: "Zu den Preisen" },
} satisfies Meta<typeof SmartLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The link rule: a route goes through next/link, an http(s) address opens in a
 * new tab, a mailto:, tel: or #anchor link is a plain anchor.
 */
export const SmartLinks: Story = {
  render: () => (
    <ul className="flex flex-col gap-2 text-body text-ink">
      <li>
        <SmartLink href="/preise">Route: /preise</SmartLink>
      </li>
      <li>
        <SmartLink href="https://example.com">Extern: example.com</SmartLink>
      </li>
      <li>
        <SmartLink href="mailto:kontakt@example.com">
          E-Mail: kontakt@example.com
        </SmartLink>
      </li>
      <li>
        <SmartLink href="tel:+490000000000">Telefon</SmartLink>
      </li>
      <li>
        <SmartLink href="#abschnitt">Sprung: #abschnitt</SmartLink>
      </li>
    </ul>
  ),
};

/** Every TextLink variant; the inverse ones sit on navy. */
export const TextLinks: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Text>
        site: Alle Details stehen in den{" "}
        <TextLink href="/agb">Geschäftsbedingungen</TextLink>.
      </Text>
      <ProseP>
        doc: Mehr dazu in der{" "}
        <TextLink variant="doc" href="/datenschutz">
          Datenschutzerklärung
        </TextLink>
        .
      </ProseP>
      <Text tone="muted">
        underline: Fragen gern{" "}
        <TextLink variant="underline" href="mailto:kontakt@example.com">
          per E-Mail
        </TextLink>
        .
      </Text>
      <div className="flex flex-col gap-2 rounded-2xl bg-navy p-5">
        <TextLink variant="inverse" href="/faecher">
          inverse: Fächer
        </TextLink>
        <TextLink variant="inverse-muted" href="/impressum">
          inverse-muted: Impressum
        </TextLink>
      </div>
    </div>
  ),
};

export const ArrowLinks: Story = {
  render: () => <ArrowLink href="/ablauf">So läuft eine Stunde ab</ArrowLink>,
};

const entries = [
  { href: "#faecher", label: "Fächer", active: true },
  { href: "#preise", label: "Preise", active: false },
];

/** Every NavLink variant, active and inactive. */
export const NavLinks: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
      <nav aria-label="Menü" className="flex flex-col">
        {entries.map((entry) => (
          <NavLink key={entry.href} href={entry.href} active={entry.active}>
            menu: {entry.label}
          </NavLink>
        ))}
        {entries.map((entry) => (
          <NavLink
            key={`${entry.href}-sub`}
            variant="menu-sub"
            href={`${entry.href}-mehr`}
            active={entry.active}
          >
            menu-sub: {entry.label}
          </NavLink>
        ))}
      </nav>
      <nav aria-label="Inhalt" className="flex flex-col gap-1 text-small">
        {entries.map((entry) => (
          <NavLink
            key={entry.href}
            variant="toc"
            href={entry.href}
            active={entry.active}
          >
            toc: {entry.label}
          </NavLink>
        ))}
      </nav>
    </div>
  ),
};
