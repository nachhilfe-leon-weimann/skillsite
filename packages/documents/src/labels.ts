/**
 * Labels that both renderers print around the legal text (spec
 * `docs/specs/documents.md`, E-14). The parser resolves the ones inside the
 * text into the nodes (`legalBasis.label`, the text of a section reference);
 * the others travel with each document as its `labels`. Web-only chrome stays
 * in `apps/marketing/src/content/`.
 */
export const labels = {
  /** Leads a legal-basis box: "Rechtsgrundlage: Art. 6 …". */
  legalBasis: "Rechtsgrundlage:",
  /** A section reference reads "<sectionRef> <number>": "Abschnitt 8". */
  sectionRef: "Abschnitt",
  /** Names the effective date: "Stand" in the hero, "Stand: Juli 2026" in the PDF. */
  effectiveDate: "Stand",
  /** Names the contact e-mail in the hero. */
  contact: "Kontakt",
  /** The PDF page counter: "Seite 2 / 5". */
  page: "Seite",
} as const;
