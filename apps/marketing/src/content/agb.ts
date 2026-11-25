import { legalContact } from "@/content/legal-contact";
import { numberedSections } from "@/lib/numbered-sections";

export const agbEffectiveDate = new Date("2026-11-16");

/** The effective date as /agb and the PDFs print it, e.g. `16. November 2026`, in any time zone. */
export const agbEffectiveDateLabel = agbEffectiveDate.toLocaleDateString(
  "de-DE",
  { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
);

export const agbContact = {
  email: legalContact.email,
  phone: legalContact.phone,
};

/** Section registry of the AGB: order, numbering, navigation labels and headings. */
export const agbSections = numberedSections([
  {
    id: "geltungsbereich",
    label: "Geltungsbereich",
    title: "Geltungsbereich",
  },
  {
    id: "vertragsschluss",
    label: "Vertragsschluss",
    title: "Vertragspartner und Vertragsschluss",
  },
  {
    id: "leistungen",
    label: "Leistungen",
    title: "Leistungen",
  },
  {
    id: "termine",
    label: "Termine und Ausfall",
    title: "Termine, Absage und Ausfall",
  },
  {
    id: "preise",
    label: "Preise und Zahlung",
    title: "Preise und Zahlung",
  },
  {
    id: "kuendigung",
    label: "Kündigung",
    title: "Laufzeit und Kündigung",
  },
  {
    id: "widerruf",
    label: "Widerrufsrecht",
    title: "Widerrufsrecht",
  },
  {
    id: "haftung",
    label: "Haftung",
    title: "Haftung",
  },
  {
    id: "schluss",
    label: "Schlussbestimmungen",
    title: "Schlussbestimmungen",
  },
]);

/** Names a section in running text by its number and title, e.g. `Abschnitt 4 („Termine …“)`. */
export function agbSectionRef(id: string): string {
  const section = agbSections.sections.find((entry) => entry.id === id);
  if (!section) throw new Error(`Unknown AGB section: ${id}`);
  return `Abschnitt ${agbSections.number(id)} („${section.title}“)`;
}
