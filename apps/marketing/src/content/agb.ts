import { legalContact } from "@/content/legal-contact";
import { numberedSections } from "@/lib/numbered-sections";

export const agbEffectiveDate = new Date("2026-07-14");

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
    title: "Widerrufsrecht für Verbraucher",
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
