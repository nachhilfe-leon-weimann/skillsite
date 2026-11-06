import { routes } from "@/lib/routes";
import { BracesIcon, LucideIcon, SigmaIcon, TriangleIcon } from "lucide-react";

export type SubjectKey = "maths" | "computer_science" | "physics";

export type SubjectTopic = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

export type Subject = {
  key: SubjectKey;
  name: string;
  /** Distinctive glyph used in the subject tile. */
  glyph: LucideIcon;
  tag?: string;
  claim: string;
  description: string;
  anchorId: string;
  href: string;
  topics: SubjectTopic[];
};

export const subjects: Subject[] = [
  {
    key: "maths",
    name: "Mathematik",
    glyph: SigmaIcon,
    claim: "Mathe logisch erklärt – verstehen statt auswendig lernen.",
    description:
      "Von den Grundlagen bis zur Analysis: Wir bauen Sicherheit auf, statt Formeln zu pauken. So kannst du auch Aufgaben lösen, die du noch nie gesehen hast.",
    anchorId: "mathematik",
    href: routes.maths,
    topics: [
      {
        title: "Grundlagen festigen",
        description:
          "Bruchrechnung, Terme und Gleichungen: Die Grundlagen sitzen, bevor es weitergeht.",
        image: "/subjects/maths-foundations.jpg",
        alt: "Abstrakte Mathematik-Illustration mit Formen, Symbolen und Grundlagenmotiven",
      },
      {
        title: "Funktionen verstehen",
        description:
          "Lineare und quadratische Funktionen: erst am Graphen sehen, dann rechnerisch nachvollziehen.",
        image: "/subjects/maths-functions.jpg",
        alt: "Illustration einer Funktionskurve in einer abstrahierten Lernszene",
      },
      {
        title: "Analysis sicher anwenden",
        description:
          "Ableitungen und Integrale werden Schritt für Schritt aus ihrer Logik heraus erklärt.",
        image: "/subjects/maths-analysis.jpg",
        alt: "Abstrakte Analysis-Illustration mit Kurvenverlauf und Flächenbezug",
      },
      {
        title: "Geometrie mit System",
        description:
          "Winkel, Flächen und Beweise werden mit System erarbeitet statt auswendig gelernt.",
        image: "/subjects/maths-geometry.jpg",
        alt: "Geometrische Illustration mit Körpern, Zirkel und Konstruktionslinien",
      },
    ],
  },
  {
    key: "computer_science",
    name: "Informatik",
    glyph: BracesIcon,
    claim: "Code verstehen statt kopieren – das Warum hinter dem Wie.",
    description:
      "Ich baue selbst Software – das fließt direkt in die Stunde ein. Wir arbeiten mit echten Beispielen aus Projekten, die wirklich laufen.",
    anchorId: "informatik",
    href: routes.computerScience,
    topics: [
      {
        title: "Programmieren mit Struktur",
        description:
          "Variablen, Bedingungen und Schleifen: klare Denkmodelle statt Ausprobieren auf gut Glück.",
        image: "/subjects/cs-programming.jpg",
        alt: "Abstrakte Informatik-Illustration mit modularen Code- und Logikbausteinen",
      },
      {
        title: "Algorithmen nachvollziehen",
        description:
          "Abläufe werden so erklärt, dass du sie lesen, planen und selbst entwickeln kannst.",
        image: "/subjects/cs-algorithms.jpg",
        alt: "Illustration eines algorithmischen Ablaufs mit verbundenen Entscheidungsstrukturen",
      },
    ],
  },
  {
    key: "physics",
    name: "Physik",
    glyph: TriangleIcon,
    claim: "Hinter die Formel blicken, Schritt für Schritt.",
    description:
      "Was passiert da eigentlich? Wir verbinden Anschauung und Rechnung, bis der Stoff hinter den Formeln Sinn ergibt.",
    anchorId: "physik",
    href: routes.physics,
    topics: [
      {
        title: "Mechanik verstehen",
        description:
          "Wir starten mit Beispielen aus dem Alltag und übertragen sie Schritt für Schritt in die Rechnung.",
        image: "/subjects/physics-mechanics.jpg",
        alt: "Physik-Illustration mit Hebeln, Pendel und Bewegungsbahnen",
      },
      {
        title: "Elektrizität durchblicken",
        description:
          "Strom, Spannung und Schaltungen werden ohne Formeldschungel verständlich gemacht.",
        image: "/subjects/physics-electricity.jpg",
        alt: "Illustration eines abstrahierten Stromkreises mit Lampe und Bauteilen",
      },
    ],
  },
];

/** The copy of /faecher around the subject data: metadata, intro, details, FAQ. */
export const subjectsPage = {
  metadata: {
    title: "Fächer",
    description:
      "Online-Nachhilfe in Mathematik, Informatik und Physik – verständlich erklärt und zum Festpreis von 30 € pro 60 Minuten.",
  },
  header: {
    eyebrow: "Fächer",
    title: "Mathe, Informatik und Physik – aus einer Hand.",
    lead: "In allen drei Fächern geht es darum, Zusammenhänge zu verstehen und sicher anzuwenden. Der Festpreis beträgt jeweils 30 € pro 60 Minuten.",
  },
  /** A subject's detail section: its price tag and the first-meeting button. */
  detail: {
    priceTag: "30 € · 60 Min.",
    /** Followed by the subject's name. */
    firstMeeting: "Erstgespräch:",
  },
  faqTitle: "Häufige Fragen zu den Fächern",
};
