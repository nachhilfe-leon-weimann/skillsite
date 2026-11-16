/** Canonical production origin, shared by sitemap, robots, metadata and JSON-LD. */
export const SITE_URL = "https://nachhilfe.leonweimann.de";

export const routes = {
  home: "/",

  subjects: "/faecher",
  maths: "/faecher#mathematik",
  computerScience: "/faecher#informatik",
  physics: "/faecher#physik",
  subjectsFaq: "/faecher#faq",

  process: "/ablauf",
  discordSection: "/ablauf#discord",
  processFaq: "/ablauf#faq",

  pricing: "/preise",
  educationParticipation: "/preise#but",

  about: "/ueber-mich",

  contact: "/kontakt",
  firstMeeting: "/kontakt#kennenlernen",

  booking: "/termin",

  onlineLearning: "/online-lernen",
  msTeams: "/online-lernen#ms-teams",

  /** Not linked anywhere: printed on invoices by sevDesk. */
  payment: "/zahlung",

  impressum: "/impressum",
  datenschutz: "/datenschutz",
  agb: "/agb",
  withdrawal: "/agb#widerruf",
} as const;

export type RouteKey = keyof typeof routes;

/**
 * Routes that exist but must stay out of search: they belong to a single
 * customer or invoice, never to a visitor arriving from Google. Declaring it
 * here keeps `robots.ts` and `sitemap.ts` from contradicting each other.
 */
const unlistedRoutes: readonly RouteKey[] = ["payment"];

/** Paths `robots.txt` disallows. */
export const disallowedPaths: string[] = unlistedRoutes.map(
  (key) => routes[key],
);

/**
 * Distinct page paths for the sitemap. Hash anchors are stripped - `/faecher`
 * and `/faecher#faq` are one page - and unlisted routes are left out.
 */
export const indexablePaths: string[] = [
  ...new Set(
    (Object.keys(routes) as RouteKey[])
      .filter((key) => !unlistedRoutes.includes(key))
      .map((key) => routes[key].split("#")[0] as string),
  ),
];
