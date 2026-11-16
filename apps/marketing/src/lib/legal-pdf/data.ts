import {
  agbEffectiveDate,
  agbEffectiveDateLabel,
  agbSectionRef,
  agbSections,
} from "@/content/agb";
import { legalContact } from "@/content/legal-contact";
import { legalPdfs, printedAddress, routes } from "@/lib/routes";

/** The PDFs `just legal-pdfs` builds: a Typst document in `legal-pdf/` and its path in `public/`. */
export const legalPdfDocuments = [
  { source: "agb.typ", output: legalPdfs.agb },
  { source: "widerrufsbelehrung.typ", output: legalPdfs.withdrawal },
] as const;

/** The AGB's effective date as an ISO day, e.g. `2026-11-16`. */
export const agbEffectiveDay = agbEffectiveDate.toISOString().slice(0, 10);

/**
 * What the Typst documents read from `generated/data.json` (`#provider.street`, `#agb.sections.<id>.heading`, ...),
 * taken from the site's content modules, so the PDFs hold no second copy of it.
 */
export function legalPdfData() {
  return {
    provider: legalContact,
    site: {
      agb: printedAddress(routes.agb),
      pricing: printedAddress(routes.pricing),
    },
    agb: {
      effectiveDate: agbEffectiveDay,
      effectiveDateLabel: agbEffectiveDateLabel,
      sections: Object.fromEntries(
        agbSections.sections.map(({ id }) => [
          id,
          { heading: agbSections.heading(id), ref: agbSectionRef(id) },
        ]),
      ),
    },
  };
}

export type LegalPdfData = ReturnType<typeof legalPdfData>;
