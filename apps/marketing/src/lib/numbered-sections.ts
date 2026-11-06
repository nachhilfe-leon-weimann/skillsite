/** A section of a numbered document, such as the AGB or the privacy policy. */
export interface NumberedSection {
  id: string;
  /** Compact name shown in the on-page navigation. */
  label: string;
  /** Full heading without a number (the number comes from the order). */
  title: string;
}

/** A numbered document's sections and the numbers and headings derived from their order. */
export interface NumberedSections<S extends NumberedSection> {
  sections: S[];
  /** 1-based section number; `0` for an unknown id. */
  number(id: string): number;
  /** Numbered heading, `"<number>. <title>"`; `""` for an unknown id. */
  heading(id: string): string;
}

/**
 * Section registry: the single source of truth for a document's order,
 * numbering, navigation labels and headings.
 */
export function numberedSections<S extends NumberedSection>(
  sections: S[],
): NumberedSections<S> {
  const number = (id: string) =>
    sections.findIndex((section) => section.id === id) + 1;
  return {
    sections,
    number,
    heading(id) {
      const section = sections.find((entry) => entry.id === id);
      return section ? `${number(id)}. ${section.title}` : "";
    },
  };
}
