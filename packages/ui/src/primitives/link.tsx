import NextLink from "next/link";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/** An address outside the site: it opens in a new tab. */
const EXTERNAL = /^https?:/;
/** Not a route: a mail or phone link, or a jump within the page. */
const PLAIN = /^(mailto:|tel:|#)/;

type SmartLinkProps = Omit<
  React.ComponentProps<"a">,
  "href" | "target" | "rel"
> & {
  href: string;
};

/**
 * The one link rule. A route goes through next/link (client-side navigation);
 * an http(s) address opens in a new tab with `rel="noopener noreferrer"`; a
 * mailto:, tel: or #anchor link is a plain anchor. Callers cannot set `target`
 * or `rel`.
 */
export function SmartLink({ href, ...props }: SmartLinkProps) {
  if (EXTERNAL.test(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
    );
  if (PLAIN.test(href)) return <a href={href} {...props} />;
  return <NextLink href={href} {...props} />;
}

const textLinkVariants = cva("", {
  variants: {
    variant: {
      /** Coral and underlined, in running text. */
      site: "font-medium text-coral underline transition-colors hover:text-coral-2 underline-offset-4",
      /** The same in legal text, with the tighter underline. */
      doc: "font-medium text-coral underline transition-colors hover:text-coral-2 underline-offset-[3px]",
      /** Underlined in the surrounding colour. */
      underline: "underline underline-offset-4",
      /** On navy: the footer's column links. */
      inverse:
        "w-fit text-small text-on-navy-soft transition-colors hover:text-white",
      /** On navy, quieter: the footer's legal and social links. */
      "inverse-muted": "text-on-navy-muted transition-colors hover:text-white",
    },
  },
  defaultVariants: { variant: "site" },
});

type TextLinkProps = SmartLinkProps & VariantProps<typeof textLinkVariants>;

/** A text link on the link rule. */
export function TextLink({ variant, className, ...props }: TextLinkProps) {
  return (
    <SmartLink
      className={cn(textLinkVariants({ variant }), className)}
      {...props}
    />
  );
}

/** A coral text link with a trailing arrow (decorative) on the link rule. */
export function ArrowLink({ className, children, ...props }: SmartLinkProps) {
  return (
    <SmartLink
      className={cn(
        "font-semibold text-coral underline underline-offset-[3px]",
        className,
      )}
      {...props}
    >
      {children} <ArrowRight className="inline size-4" aria-hidden />
    </SmartLink>
  );
}

const navLinkVariants = cva("", {
  variants: {
    variant: {
      /** A row of the mobile menu. */
      menu: "border-b border-line py-3 text-body",
      /** An indented row under a menu entry. */
      "menu-sub": "border-b border-line py-2.5 pl-4 text-small",
      /** An entry of a page's table of contents. */
      toc: "block rounded-lg px-2 py-1.5 transition-colors",
    },
    active: { true: "", false: "" },
  },
  compoundVariants: [
    {
      variant: ["menu", "menu-sub"],
      active: true,
      class: "font-semibold text-ink",
    },
    {
      variant: ["menu", "menu-sub"],
      active: false,
      class: "font-medium text-ink-soft",
    },
    {
      variant: "toc",
      active: true,
      class: "bg-surface-2 font-medium text-ink",
    },
    { variant: "toc", active: false, class: "text-ink-soft hover:text-ink" },
  ],
  defaultVariants: { variant: "menu", active: false },
});

type NavLinkProps = SmartLinkProps & VariantProps<typeof navLinkVariants>;

/**
 * A navigation link that shows whether it is active. `aria-current` is the
 * caller's: a link to the current section is active, but only a link to the
 * current page is `aria-current="page"`.
 */
export function NavLink({
  variant,
  active,
  className,
  ...props
}: NavLinkProps) {
  return (
    <SmartLink
      className={cn(navLinkVariants({ variant, active }), className)}
      {...props}
    />
  );
}
