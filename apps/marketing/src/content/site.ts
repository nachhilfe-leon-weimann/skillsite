import {
  brand as documentBrand,
  provider,
} from "@skillsite/documents/provider";

import { routes } from "@/lib/routes";

/** Name and tagline are shared with the legal documents (E-12 of docs/specs/documents.md). */
export const brand = {
  name: documentBrand.name,
  tagline: documentBrand.tagline,
  logo: "/logo-icon.png",
  owner: provider.ownerName,
};

export type NavLink = { label: string; href: string };

/** Flat primary navigation (also used in the footer). */
export const primaryNav: NavLink[] = [
  { label: "Fächer", href: routes.subjects },
  { label: "Ablauf", href: routes.process },
  { label: "Preise", href: routes.pricing },
  { label: "Über mich", href: routes.about },
  { label: "Kontakt", href: routes.contact },
];

export type PlatformNavItem = NavLink & { note: string };

/** "Online lernen" dropdown. */
export const platformNav: PlatformNavItem[] = [
  {
    label: "Discord",
    note: "Server, Einrichtung und Funktionen",
    href: routes.onlineLearning,
  },
  {
    label: "Microsoft Teams",
    note: "Auch über Teams möglich",
    href: routes.msTeams,
  },
  {
    label: "Termin buchen",
    note: "Freie Slots im Kalender",
    href: routes.booking,
  },
];

export const primaryCta = {
  label: "Kostenloses Erstgespräch",
  /** Shorter label for the compact navbar range (nav to nav-wide, 1080-1277px at the default font size). */
  shortLabel: "Erstgespräch",
  href: routes.firstMeeting,
};

export const trustLine = "Kostenlos, unverbindlich und ohne Benutzerkonto.";
