export type Step = { n: string; title: string; text: string };

/** Onboarding in three steps (shared by the home page and /ablauf). */
export const startSteps: Step[] = [
  {
    n: "1",
    title: "Kostenloses Erstgespräch",
    text: "Wir klären Fach, Ziel, aktuelle Probleme und ob die Zusammenarbeit passt.",
  },
  {
    n: "2",
    title: "Erste Stunde",
    text: "Wir schauen uns echte Aufgaben an, finden Lücken und legen fest, womit wir starten.",
  },
  {
    n: "3",
    title: "Flexibel weiterlernen",
    text: "Danach buchst du flexibel: regelmäßig, vor Klausuren intensiver oder nach Bedarf.",
  },
];

export const lessonFlow: Step[] = [
  {
    n: "1",
    title: "Kurz sortieren",
    text: "Was ist heute das Ziel? Hausaufgabe, Klausurthema oder Verständnisproblem?",
  },
  {
    n: "2",
    title: "Gemeinsam lösen",
    text: "Wir arbeiten an echten Aufgaben, bis der Denkweg sitzt.",
  },
  {
    n: "3",
    title: "Festhalten",
    text: "Am Ende ist klar, was du verstanden hast und was du bis zum nächsten Mal übst.",
  },
];

export const discordHighlights: string[] = [
  "Live im Sprachkanal mit geteiltem Bildschirm.",
  "Notizen und Materialien bleiben während unserer Zusammenarbeit abrufbar.",
  "Kurze Fragen kannst du auch zwischen den Stunden stellen.",
];

/** The navy panel on /ablauf: where the lessons take place. */
export const discordPanel = {
  eyebrow: "Unser Klassenzimmer",
  title: "Unterricht über Discord oder Microsoft Teams",
  text: "Live mit geteiltem Bildschirm: wie am selben Tisch, nur ohne Anfahrt. Du wählst die Plattform, die für dich am einfachsten ist.",
  platforms: ["Discord", "Microsoft Teams"],
  /** The highlights are `discordHighlights`. */
  setupLink: "So richtest du Discord ein",
};

/** The copy of /ablauf around the step lists: metadata, intros, booking, FAQ. */
export const processPage = {
  metadata: {
    title: "Ablauf",
    description:
      "So läuft die Nachhilfe ab: kostenloses Erstgespräch, erste Stunde und flexible Termine. Online über Discord oder Microsoft Teams.",
  },
  header: {
    eyebrow: "Ablauf",
    title: "So läuft die Nachhilfe bei mir ab.",
    lead: "Kein Schema F. Wir klären zuerst, wo du stehst, und machen daraus einen Plan, der zu deinem Ziel passt.",
  },
  startTitle: "Einstieg in drei Schritten",
  lesson: {
    eyebrow: "Eine Stunde – 60 Minuten",
    title: "So ist eine Stunde aufgebaut.",
  },
  booking: {
    title: "Termine selbst buchen",
    text: "Freie Slots direkt im Kalender wählen – wöchentlich, vor Klausuren intensiver oder nach Bedarf. Bis 24 Stunden vorher kostenfrei absagen.",
    link: "Verfügbare Termine ansehen",
  },
  faqTitle: "Häufige Fragen zum Ablauf",
};
