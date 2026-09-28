import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge that knows the theme of `styles/theme.css`. Without this it
 * reads unknown names as colours (`text-eyebrow` as a text colour, `bg-coral-gradient`
 * as a background colour) and drops them next to a real colour. Every token and
 * `@utility` of theme.css is listed here; `cn.test.ts` fails when one is missing.
 * Colour tokens need no entry: tailwind-merge takes any unknown `bg-*`/`text-*`/
 * `border-*`/`ring-*` name for a colour, which is what they are.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "title",
        "eyebrow",
        "lead",
        "body",
        "small",
        "caption",
        // Role sizes outside the scale
        "accordion",
        "button",
        "button-lg",
        "callout",
        "card-body",
        "card-link",
        "card-title",
        "card-title-sm",
        "chip-icon",
        "code",
        "digit-lg",
        "digit-md",
        "digit-sm",
        "footnote",
        "icon-badge",
        "logo",
        "logo-tagline",
        "month",
        "price",
        "price-badge",
        "price-unit",
        "quote",
        "quote-lg",
        "quote-source",
        "stat",
        "stat-sm",
        "stat-label",
        "stat-label-sm",
        "step-title",
        // Legal pages
        "prose-h2",
        "prose-h3",
        "prose-body",
        "prose-sm",
        "prose-xs",
        // UI role sizes at Tailwind's default sizes
        "accordion-icon",
        "button-sm",
        "note",
        "skip-link",
        "tag",
      ],
      shadow: [
        "card",
        "glow-sm",
        "glow-md",
        "glow-lg",
        "raised",
        "popover-inverse",
        "logo",
        "focus",
      ],
      radius: ["callout", "stat", "caret"],
      ease: ["flow", "soft"],
      animate: ["rise", "fade", "fade-down", "draw", "rise-soft", "settle"],
      container: [
        "page",
        "measure-12",
        "measure-13",
        "measure-14",
        "measure-15",
        "measure-16",
        "measure-18",
        "measure-24",
        "measure-26",
        "measure-30",
        "measure-32",
        "measure-34",
        "measure-38",
        "measure-40",
        "measure-42",
      ],
      spacing: [
        "split",
        "split-about",
        "split-hero",
        "hero-top",
        "hero-bottom",
        "page-top",
        "page-header-bottom",
        "intro-bottom",
        "footer",
        "doc",
        "panel",
        "panel-contact",
        "panel-timeline",
        "panel-quote",
        "panel-pricing",
        "panel-cta",
        "panel-booker",
        "panel-booker-main",
      ],
    },
    classGroups: {
      duration: [{ duration: ["quick", "base", "slow", "flow", "settle"] }],
      z: [{ z: ["raised", "dropdown", "sticky", "overlay"] }],
      py: [{ py: ["section", "section-sm"] }],
      pt: [{ pt: ["section"] }],
      pb: [{ pb: ["section", "section-sm"] }],
      "bg-image": [{ bg: ["coral-gradient"] }],
      hyphens: [{ hyphens: ["heading"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
