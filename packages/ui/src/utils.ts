import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge that knows the theme of `styles/theme.css`. Without this it
 * reads unknown names as colours (`text-eyebrow` as a text colour, `bg-coral-gradient`
 * as a background colour) and drops them next to a real colour. Every token and
 * `@utility` of theme.css is listed here; `utils.test.ts` fails when one is missing.
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
      ],
      shadow: ["card"],
      ease: ["flow", "soft"],
      animate: ["rise", "fade", "fade-down", "draw", "rise-soft", "settle"],
      container: ["page"],
    },
    classGroups: {
      duration: [{ duration: ["quick", "base", "slow", "flow", "settle"] }],
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
