import type { Stat } from "@/content/home";

export const aboutIntro =
  "Ich gebe Nachhilfe in Mathe, Informatik und Physik. Nicht nach Schema, sondern so, dass es zur Person vor mir passt. Ich glaube: Es gibt keine „Mathe-Menschen“ und „Nicht-Mathe-Menschen“, nur Erklärungen, die passen, und solche, die es nicht tun.";

export const aboutStats: Stat[] = [
  { value: "320+", label: "Stunden" },
  { value: "35+", label: "Schüler:innen" },
  { value: "3", label: "Fächer" },
];

export const aboutQuote =
  "Keine dummen Fragen – nur unverständliche Erklärungen. Und die gehen auf mich.";

export type Principle = { n: string; title: string; text: string };

export const principles: Principle[] = [
  {
    n: "1",
    title: "Verstehen schlägt Auswendiglernen",
    text: "Wer das Prinzip versteht, kann auch unbekannte Aufgaben lösen.",
  },
  {
    n: "2",
    title: "Dein Tempo, dein Weg",
    text: "Kein starres Programm – wir starten dort, wo du wirklich stehst.",
  },
  {
    n: "3",
    title: "Fragen gehören dazu",
    text: "Du kannst jederzeit nachhaken – ohne Druck und auf Augenhöhe.",
  },
];

export const software = {
  eyebrow: "Praxis statt Lehrbuch",
  title: "Ich baue selbst Software.",
  text: "Diese Website samt Buchungssystem habe ich vom Design bis zum Code selbst entwickelt. In der Informatik-Nachhilfe heißt das: echte Beispiele aus Projekten, die wirklich laufen, statt trockener Theorie.",
};

/** The quotation marks around `aboutQuote`. */
export const quoteMarks = { open: "„", close: "“" };

/** The copy of /ueber-mich around its data: metadata, intro, section titles and the code sample. */
export const aboutPage = {
  metadata: {
    title: "Über mich",
    description:
      "Hi, ich bin Leon. Ich gebe Nachhilfe in Mathe, Informatik und Physik – individuell statt nach Schema, auf Augenhöhe und ohne Druck.",
  },
  /** Eyebrow, title and button label of the intro; its lead is `aboutIntro`. */
  intro: {
    eyebrow: "Über mich",
    title: "Hi, ich bin Leon.",
    firstMeeting: "Finde heraus, ob wir zusammenpassen",
  },
  principlesTitle: "Woran ich mich halte",
  /** The words of the code sample typed beside the software text; its syntax lives in `code-typewriter`. */
  code: {
    comment: "das Prinzip zuerst",
    fn: "verstehen",
    param: "stoff",
    check: "klickt",
    result: "kann ich selbst",
    retry: "nochmal",
    retryArg: "anderswie",
  },
};
