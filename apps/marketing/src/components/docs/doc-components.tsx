import { ExternalLink, type LucideIcon, Scale } from "lucide-react";

import { Container } from "@skillsite/ui/layout/container";
import { Card } from "@skillsite/ui/primitives/card";
import { IconBadge } from "@skillsite/ui/primitives/icon-badge";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { InlineLink, ProseH2, ProseH3 } from "@skillsite/ui/typography/prose";
import { Lead } from "@skillsite/ui/typography/lead";
import { cn } from "@skillsite/ui/utils/cn";

import { DocSectionNav, type DocNavSection } from "./doc-section-nav";

type DocShellProps = {
  /** Rendered full-width above the grid so the title always leads the page. */
  hero: React.ReactNode;
  sections?: DocNavSection[];
  children: React.ReactNode;
};

export function DocShell({ hero, sections, children }: DocShellProps) {
  return (
    <Container className="py-doc">
      <div className="mx-auto w-full max-w-5xl">
        {hero}
        <div
          className={cn(
            "mt-10 grid gap-10",
            sections && "lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-14",
          )}
        >
          <article className="min-w-0">{children}</article>
          {sections ? (
            <aside className="order-first lg:order-last lg:sticky lg:top-24 lg:self-start">
              <DocSectionNav sections={sections} />
            </aside>
          ) : null}
        </div>
      </div>
    </Container>
  );
}

type DocHeroProps = {
  badge: string;
  icon: LucideIcon;
  title: React.ReactNode;
  lead: React.ReactNode;
  facts?: Array<{ icon: LucideIcon; label: string; children: React.ReactNode }>;
};

export function DocHero({
  badge,
  icon: Icon,
  title,
  lead,
  facts,
}: DocHeroProps) {
  return (
    <Card className="p-6 sm:p-8">
      <Reveal trigger="mount" variant="rise-soft">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 text-prose-sm text-ink-soft">
          <Icon className="size-4" aria-hidden />
          {badge}
        </div>
        <Heading as="h1" size="h1" className="mt-5">
          {title}
        </Heading>
        <Lead className="mt-4 max-w-3xl">{lead}</Lead>
        {facts?.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {facts.map((fact) => {
              const FactIcon = fact.icon;
              return (
                <Card
                  key={fact.label}
                  surface="inset"
                  radius="xl"
                  className="flex items-center gap-3 p-3"
                >
                  <IconBadge
                    layout="grid"
                    size="9"
                    shape="md"
                    tone="muted"
                    className="shrink-0"
                  >
                    <FactIcon className="size-4" aria-hidden />
                  </IconBadge>
                  <div className="min-w-0">
                    <p className="text-prose-xs text-ink-soft">{fact.label}</p>
                    <p className="truncate text-prose-sm font-medium text-ink">
                      {fact.children}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}
      </Reveal>
    </Card>
  );
}

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="border-b border-line py-10 last:border-b-0 sm:py-12"
    >
      <ProseH2 className="max-w-3xl">{title}</ProseH2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function DocSubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-l border-line pl-4 not-first:mt-8 sm:pl-6">
      <ProseH3>{title}</ProseH3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function DocGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="not-first:mt-10">
      <p className="mb-4 text-prose-sm font-semibold uppercase tracking-wide text-ink-soft">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

export function DocList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={cn("my-4 space-y-2 leading-7 text-ink", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-ink/40"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Indented plain-text copy template, e.g. the statutory model
 * withdrawal form.
 */
export function DocIndentBlock({
  lines,
  footnote,
}: {
  lines: string[];
  footnote?: string;
}) {
  return (
    <div className="my-4 pl-4 sm:pl-6">
      <div className="space-y-2">
        {lines.map((line) => (
          <p key={line} className="leading-7 text-ink">
            {line}
          </p>
        ))}
      </div>
      {footnote ? (
        <p className="mt-3 text-prose-sm leading-6 text-ink-soft">{footnote}</p>
      ) : null}
    </div>
  );
}

export function DocDetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="my-5 grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function DocDetailList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card surface="doc" radius="xl" className="p-4">
      <p className="text-prose-sm font-medium leading-6 text-ink">{title}</p>
      <DocList items={items} className="my-3 text-prose-sm leading-6" />
    </Card>
  );
}

export function DocLinkList({
  links,
}: {
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <ul className="my-4 grid gap-2 sm:grid-cols-2">
      {links.map((link) => (
        <li key={link.href}>
          <Card
            asChild
            surface="flat"
            radius="xl"
            className="flex items-center justify-between gap-3 px-3 py-2.5 text-prose-sm text-ink transition-colors hover:border-coral"
          >
            <a href={link.href} target="_blank" rel="noreferrer">
              <span>{link.label}</span>
              <ExternalLink
                className="size-3.5 shrink-0 text-ink-soft"
                aria-hidden
              />
            </a>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function DocProviderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <p className="leading-7 not-first:mt-4">
      <InlineLink
        variant="doc"
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1"
      >
        {children}
        <ExternalLink className="size-3.5" aria-hidden />
      </InlineLink>
    </p>
  );
}

export function DocLegalBasis({ children }: { children: React.ReactNode }) {
  return (
    <Card surface="doc" radius="xl" className="mt-4 flex gap-3 p-3">
      <Scale className="mt-1 size-4 shrink-0 text-ink-soft" aria-hidden />
      <p className="text-prose-sm leading-6 text-ink-soft">
        <span className="font-medium text-ink">Rechtsgrundlage: </span>
        {children}
      </p>
    </Card>
  );
}
