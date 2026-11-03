import type { Metadata } from "next";

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

/** The root layout's defaults; every route inherits these unless it sets its own. */
export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Online-Nachhilfe für Mathe, Informatik und Physik",
    template: "%s – Nachhilfe Leon Weimann",
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
