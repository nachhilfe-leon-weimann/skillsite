"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/* ----------------------------------------------------------------------------
 * Card: the bordered, rounded surface. Padding and layout are set by the
 * caller. `tone` picks the colour role; on the default tone, `surface` picks
 * one of the measured surfaces (each a fixed set of border, background and
 * shadow). `lift` is the hover lift of a card that is a link. Animated cards
 * are `<Reveal as={Card} ...>` (one element). A lifting card never is: the
 * unlayered `.reveal` rules override `lift`, so it stays a child of a Reveal.
 * A client module (no hooks): a server page can pass only a client module to
 * the client `Reveal`, and `as={Card}` is such a pass. The price: under
 * `asChild`, a server component child (e.g. `InfoRow` in the legal pages) is
 * rendered before `Slot` sees it, so `Slot` joins the card's classes to the
 * rendered element's without `cn` - a conflicting class is not resolved there.
   ------------------------------------------------------------------------- */
const cardVariants = cva("", {
  variants: {
    tone: {
      default: "",
      /** Navy panel. The text colour is the caller's (`text-on-navy` or a child's). */
      inverse: "bg-navy shadow-card",
      /** Coral gradient panel. Its glow (`shadow-glow-*`) is the caller's. */
      accent: "bg-coral-gradient text-white",
    },
    radius: {
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      callout: "rounded-callout",
    },
    lift: {
      none: "",
      sm: "lift [--lift:-0.25rem]",
      md: "lift [--lift:-0.375rem]",
    },
    /** Surfaces of the default tone (ignored by the other tones). */
    surface: {
      raised: "",
      flat: "",
      inset: "",
      subtle: "",
      doc: "",
      frame: "",
      glass: "",
    },
  },
  compoundVariants: [
    {
      tone: "default",
      surface: "raised",
      class: "border border-line bg-surface shadow-card",
    },
    /** A raised card without the shadow (link lists on the legal pages). */
    {
      tone: "default",
      surface: "flat",
      class: "border border-line bg-surface",
    },
    /** On a `surface` band: the page background, no shadow. */
    { tone: "default", surface: "inset", class: "border border-line bg-bg" },
    {
      tone: "default",
      surface: "subtle",
      class: "border border-line bg-surface-2",
    },
    /** Note boxes of the legal pages. */
    {
      tone: "default",
      surface: "doc",
      class: "border border-line bg-surface-2/60",
    },
    /** Border and shadow, no background (a frame around split panels or a photo). */
    {
      tone: "default",
      surface: "frame",
      class: "border border-line shadow-card",
    },
    /** A white wash on navy. */
    {
      tone: "default",
      surface: "glass",
      class: "border border-overlay-12 bg-overlay-8",
    },
    { tone: "default", lift: ["sm", "md"], class: "hover:border-coral" },
  ],
  defaultVariants: {
    tone: "default",
    radius: "2xl",
    lift: "none",
    surface: "raised",
  },
});

type CardProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    /** Render the single child (a link, a `nav`) with the card's look instead of a `div`. */
    asChild?: boolean;
  };

export function Card({
  tone,
  radius,
  lift,
  surface,
  asChild = false,
  className,
  ...props
}: CardProps) {
  const Component = asChild ? Slot : "div";
  return (
    <Component
      className={cn(cardVariants({ tone, radius, lift, surface }), className)}
      {...props}
    />
  );
}
