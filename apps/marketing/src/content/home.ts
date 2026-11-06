export type Stat = { value: string; label: string };

export const homeStats: Stat[] = [
  { value: "320+", label: "Unterrichtsstunden" },
  { value: "35+", label: "begleitete Schüler:innen" },
  { value: "3", label: "Fächer aus einer Hand" },
  { value: "30 €", label: "pro 60 Minuten" },
];

export type Benefit = { title: string; text: string };

export const benefits: Benefit[] = [
  {
    title: "Keine Mindestlaufzeit",
    text: "Jederzeit pausieren oder aufhören – ganz ohne Abo.",
  },
  {
    title: "Fairer Festpreis",
    text: "30 € pro 60 Minuten für alle angebotenen Fächer und Klassenstufen.",
  },
  {
    title: "Selbst buchen",
    text: "Freie Termine selbst buchen und bis 24 Stunden vorher kostenfrei absagen.",
  },
  {
    title: "Erreichbar über Discord",
    text: "Kurze Fragen kannst du mir auch zwischen den Stunden schreiben.",
  },
  {
    title: "Kostenloses Erstgespräch",
    text: "Erst kennenlernen, dann in Ruhe entscheiden.",
  },
  {
    title: "Immer dieselbe Person",
    text: "Persönlich und individuell statt nach Schema F.",
  },
];

/** The home page's hero: intro, calls to action and the two floating badges. */
export const homeHero = {
  eyebrow: "Nachhilfe in Mathematik, Informatik und Physik",
  /** The headline; `highlight` is the underlined word between the two parts. */
  title: { before: "Lernen, bis es", highlight: "klick", after: "macht." },
  lead: "Hi, ich bin Leon. Ich erkläre dir den Stoff so lange, bis er wirklich Sinn ergibt – persönlich, online und ohne Mindestlaufzeit.",
  subjectsLink: "Fächer ansehen",
  /** The price badge over the photo: the amount, then two lines of note. */
  priceBadge: {
    amount: "30 €",
    unit: "pro 60 Minuten",
    scope: "jedes angebotene Fach",
  },
  /** The navy tag on the photo's top edge. */
  tag: "Ohne Mindestlaufzeit",
};

export type SectionIntro = { eyebrow: string; title: string };

/** The intros of the home page's sections, in page order. */
export const homeSections: Record<
  "subjects" | "process" | "benefits",
  SectionIntro
> = {
  subjects: {
    eyebrow: "Drei Fächer, ein Anspruch",
    title:
      "Mathe, Informatik und Physik – verstanden, nicht auswendig gelernt.",
  },
  process: {
    eyebrow: "So fängt es an",
    title: "In drei Schritten zur ersten Stunde.",
  },
  benefits: {
    eyebrow: "Fair und unkompliziert",
    title: "Nachhilfe mit klaren Bedingungen.",
  },
};
