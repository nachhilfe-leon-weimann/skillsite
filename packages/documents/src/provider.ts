/**
 * The provider and brand data the legal texts share with the rest of the site
 * (spec `docs/specs/documents.md`, E-12): the site, the JSON-LD, the parser and
 * both renderers read this one module. Plain data with no imports, so a client
 * component may import it without pulling in a legal tree.
 */

/** The business behind the site, as the Impressum, the AGB and the privacy policy name it. */
export const provider = {
  businessName: "Nachhilfe Leon Weimann",
  ownerName: "Leon Weimann",
  street: "Friedhofstraße 11",
  city: "77963 Schwanau",
  country: "Deutschland",
  email: "nachhilfe@leonweimann.de",
  phone: "+49 7824 6190305",
};

/** Own domains – kept central so they render identically everywhere. */
export const domains = {
  site: "nachhilfe.leonweimann.de",
  analytics: "insights.leonweimann.de",
};

/** The brand's name and tagline, as the logo lockup shows them. */
export const brand = {
  name: "Nachhilfe Leon Weimann",
  tagline: "Verstehen statt auswendig lernen.",
};
