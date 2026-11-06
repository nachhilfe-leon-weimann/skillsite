import type { Step } from "@/content/process";

export const lessonPrice = {
  amount: "30 €",
  unit: "· 60 Min.",
  note: "Ein Preis für Mathe, Informatik und Physik – in allen angebotenen Klassenstufen.",
};

export const priceIncludes: string[] = [
  "Keine Anmeldegebühr, keine versteckten Kosten",
  "Keine Mindestlaufzeit – flexibel planbar",
  "Bis 24 Stunden vorher kostenfrei absagen oder verschieben",
  "Materialien und Notizen inklusive",
  "Förderung über das Bildungs- und Teilhabepaket möglich",
];

export type Condition = { strong?: string; text: string };

export const fairConditions: Condition[] = [
  {
    strong: "Bis 24 Stunden vorher",
    text: "kostenfrei absagen oder verschieben.",
  },
  { text: "Bei kurzfristigen Notfällen finden wir eine faire Lösung." },
  { text: "Termine einzeln oder regelmäßig planen – ganz nach Bedarf." },
];

export const paymentOptions: Condition[] = [
  { strong: "Überweisung", text: "– Rechnung mit GiroCode." },
  { strong: "PayPal", text: "– einfacher Zahlungslink." },
  {
    text: "Abrechnung einzeln nach dem Termin oder gesammelt für mehrere Termine.",
  },
];

export const but = {
  intro:
    "Nachhilfe kann über das Bildungs- und Teilhabepaket (BuT) gefördert werden – zum Beispiel bei Bürgergeld oder Wohngeld mit Kinderzuschlag. Für mich ist das kein Sonderfall: Bei passender Bewilligung rechne ich direkt mit der zuständigen Stelle ab.",
  officialInfo: {
    href: "https://familienportal.de/familienportal/familienleistungen/bildung-und-teilhabe/wie-beantrage-ich-leistungen-fuer-bildung-und-teilhabe--136770",
    label: "Offizielle BuT-Infos",
    source: "familienportal.de",
  },
  steps: [
    {
      n: "1",
      title: "",
      text: "Förderbedarf von der Schule bestätigen lassen.",
    },
    {
      n: "2",
      title: "",
      text: "Antrag beim Jobcenter oder Landratsamt stellen.",
    },
    {
      n: "3",
      title: "",
      text: "Unterricht starten – die Abrechnung übernehme ich direkt.",
    },
  ] satisfies Step[],
};

/** The copy of /preise around the price data: metadata, intro, panel, cards, BuT, FAQ. */
export const pricingPage = {
  metadata: {
    title: "Preise",
    description:
      "Klare Preise ohne Überraschungen: 30 € pro 60 Minuten für alle angebotenen Fächer und Klassenstufen. BuT-Förderung ist möglich.",
  },
  header: {
    eyebrow: "Preise",
    title: "Klare Preise ohne Überraschungen.",
  },
  /** The navy half of the price panel: the label above the price and its button. */
  panel: {
    label: "Festpreis für jedes angebotene Fach",
    firstMeeting: "Kostenloses Erstgespräch",
  },
  /** The two cards under the price panel, in page order. */
  conditionCards: [
    { title: "Faire Bedingungen", items: fairConditions },
    { title: "Zahlung und Abrechnung", items: paymentOptions },
  ] satisfies { title: string; items: Condition[] }[],
  but: {
    eyebrow: "Bildung und Teilhabe",
    title: "Geförderte Nachhilfe – unkompliziert abgerechnet.",
    /** Followed by `but.officialInfo.source`. */
    sourceLabel: "Quelle:",
    /** The accessible name of the official-info button. */
    officialInfoLabel: `${but.officialInfo.label} auf ${but.officialInfo.source} öffnen`,
  },
  faqTitle: "Häufige Fragen zu Preis und Zahlung",
};
