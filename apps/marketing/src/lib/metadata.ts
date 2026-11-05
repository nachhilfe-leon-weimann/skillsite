import type { Metadata, Viewport } from "next";

import { brandColors } from "@skillsite/ui/tokens/colors";
import { brand } from "@/content/site";
import { SITE_URL } from "@/lib/routes";

const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Nachhilfe Leon Weimann – Mathematik, Informatik und Physik",
};

const siteOpenGraph = {
  type: "website",
  locale: "de_DE",
  siteName: "Nachhilfe Leon Weimann",
  title: "Online-Nachhilfe für Mathe, Informatik und Physik",
  description:
    "Persönliche Online-Nachhilfe – flexibel, ohne Mindestlaufzeit und für 30 € pro 60 Minuten.",
} satisfies NonNullable<Metadata["openGraph"]>;

/** The site's tab title: a page's title, then the brand. */
const titleTemplate = "%s – Nachhilfe Leon Weimann";

/** A page title in the site's template, for a document Next's metadata does not reach. */
export function templatedTitle(title: string): string {
  // A replacer function, so `$&` and similar patterns in a title stay literal.
  return titleTemplate.replace("%s", () => title);
}

/**
 * The root layout's viewport. `global-error.tsx` replaces the layout, where the
 * `viewport` export does not reach, and renders the same tags from it.
 */
export const siteViewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brandColors.bg },
    { media: "(prefers-color-scheme: dark)", color: brandColors.bgDark },
  ],
} satisfies Viewport;

/** `siteViewport` as the content of `<meta name="viewport">`, in Next's order. */
export const siteViewportContent = [
  `width=${siteViewport.width}`,
  `initial-scale=${siteViewport.initialScale}`,
  `viewport-fit=${siteViewport.viewportFit}`,
].join(", ");

/** The root layout's defaults; every route inherits these unless it sets its own. */
export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Online-Nachhilfe für Mathe, Informatik und Physik",
    template: titleTemplate,
  },
  description:
    "Persönliche Online-Nachhilfe in Mathematik, Informatik und Physik – flexibel, ohne Mindestlaufzeit und für 30 € pro 60 Minuten.",
  openGraph: siteOpenGraph,
  twitter: {
    card: "summary_large_image",
    title: "Online-Nachhilfe für Mathe, Informatik und Physik",
    description:
      "Persönliche Online-Nachhilfe – flexibel, ohne Mindestlaufzeit und für 30 € pro 60 Minuten.",
  },
  verification: {
    other: {
      "facebook-domain-verification": "mgl8asl7f0d24t8p3g6kb2x9bw9or0",
    },
  },
};

type PageMetadataInput =
  /** The home page: the site's default title, description and social card, plus its URL. */
  | { home: true }
  /** A listed page: own title and description, echoed into the social card. */
  | { title: string; description: string; canonical: string }
  /** An unlisted page (noindex, disallowed in robots.txt): no canonical, the site's social card. */
  | { title: string; unlisted: true };

/** The only way a route declares metadata; keeps search and social copy aligned. */
export function pageMetadata(input: PageMetadataInput): Metadata {
  if ("home" in input) {
    return {
      alternates: { canonical: "/" },
      openGraph: { ...siteOpenGraph, url: "/" },
    };
  }

  if ("unlisted" in input) {
    return { title: input.title, robots: { index: false, follow: false } };
  }

  const { title, description, canonical } = input;
  const socialTitle = `${title} – ${brand.name}`;

  return {
    alternates: { canonical },
    title,
    description,
    openGraph: {
      type: "website",
      locale: "de_DE",
      url: canonical,
      siteName: brand.name,
      title: socialTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
    },
  };
}
