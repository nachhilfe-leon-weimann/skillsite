import { legalContact } from "@/content/legal-contact";

/**
 * The electronic withdrawal function (§ 356a BGB) at /widerrufsrecht. It
 * addresses contract partners in the Sie-form of the withdrawal notice in the
 * AGB, unlike the rest of the site.
 */

/** The address a withdrawal goes to when the function cannot send it. */
export const withdrawalFallbackEmail = legalContact.email;

/** The way in: the footer on every page and the booking's confirmation. */
export const withdrawalLink = {
  /** § 356a (1) BGB: the function is labelled "Vertrag widerrufen". */
  label: "Vertrag widerrufen",
  /** Below a confirmed paid booking, in the booker's du-form. */
  bookingHint:
    "Du kannst diese Buchung innerhalb der Widerrufsfrist auch online widerrufen:",
} as const;

/** /widerrufsrecht around the form: metadata and intro. */
export const withdrawalPage = {
  metadata: {
    title: "Vertrag widerrufen",
    description:
      "Widerrufsfunktion: Verträge über Nachhilfeleistungen online widerrufen und unverzüglich eine Eingangsbestätigung per E-Mail erhalten.",
  },
  header: {
    eyebrow: "Widerrufsfunktion",
    title: "Vertrag widerrufen",
    lead: "Hier können Sie einen Vertrag über Nachhilfeleistungen online widerrufen. Nach dem Absenden erhalten Sie unverzüglich eine Eingangsbestätigung per E-Mail.",
  },
  intro: {
    title: "So funktioniert der Widerruf",
    steps:
      "Geben Sie Ihre Angaben ein, prüfen Sie diese und bestätigen Sie den Widerruf. Die Eingangsbestätigung enthält den Inhalt Ihrer Erklärung sowie Datum und Uhrzeit ihres Eingangs.",
    deadline:
      "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie den Widerruf vor Ablauf der Frist über diese Funktion absenden.",
    notice: {
      before: "Alle Einzelheiten zu Ihrem Widerrufsrecht finden Sie in der ",
      link: "Widerrufsbelehrung",
      after: ".",
    },
    otherWays: {
      before:
        "Sie können Ihren Widerruf auch weiterhin auf anderem Weg erklären, zum Beispiel per E-Mail an ",
      after: ".",
    },
  },
} as const;

/** The form, its review step and its outcomes. */
export const withdrawalText = {
  formTitle: "Ihre Angaben",
  /** Off-screen anti-spam field; meaningless to autofill on purpose. */
  honeypotLabel: "Bitte leer lassen",
  fields: {
    name: {
      label: "Name",
      placeholder: "Vor- und Nachname",
      error: "Bitte geben Sie Ihren Namen an.",
    },
    email: {
      label: "E-Mail-Adresse für die Eingangsbestätigung",
      placeholder: "name@beispiel.de",
      error: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
    },
    contract: {
      label: "Welchen Vertrag möchten Sie widerrufen?",
      placeholder:
        "z. B. gebuchter Termin am 24.11.2026 oder Nachhilfevereinbarung vom …",
      description:
        "Bitte so genau, dass sich der Vertrag zuordnen lässt, zum Beispiel mit Datum.",
      error: "Bitte geben Sie an, welchen Vertrag Sie widerrufen möchten.",
    },
    note: {
      label: "Ergänzung",
      hint: "(optional)",
      error: "Bitte kürzen Sie Ihre Ergänzung.",
    },
  },
  submit: "Vertrag widerrufen",
  /** Below a field whose value holds a link: the e-mails never carry one. */
  linkError: "Bitte geben Sie hier keine Links oder Webadressen an.",
  /** Above the form once a submit found invalid fields. */
  invalid: "Bitte prüfen Sie die markierten Angaben.",

  review: {
    title: "Bitte prüfen Sie Ihre Angaben",
    text: "Mit „Widerruf bestätigen“ senden Sie die folgende Widerrufserklärung ab:",
    confirm: "Widerruf bestätigen",
    edit: "Angaben ändern",
  },

  /** The declaration as the review shows it and both e-mails carry it. */
  declaration: {
    statement: "Hiermit widerrufe ich den folgenden Vertrag.",
    name: "Name",
    email: "E-Mail-Adresse für die Eingangsbestätigung",
    contract: "Widerrufener Vertrag",
    note: "Ergänzung",
    noNote: "–",
  },

  result: {
    pending: {
      title: "Widerruf wird übermittelt …",
      text: "Einen Moment bitte.",
    },
    sent: {
      title: "Widerruf eingegangen",
      receivedLabel: "Eingang",
      text: "Die Eingangsbestätigung ist per E-Mail an die angegebene Adresse unterwegs. Falls sie nicht ankommt, sehen Sie bitte auch im Spam-Ordner nach.",
    },
    notSent: {
      title: "Keine Eingangsbestätigung",
      text: "Die automatische Übermittlung hat leider nicht geklappt, und wir konnten Ihnen keine Eingangsbestätigung senden. Bitte senden Sie Ihren Widerruf zur Sicherheit zusätzlich per E-Mail an die folgende Adresse.",
    },
    unknown: {
      title: "Übermittlung nicht bestätigt",
      text: "Wir konnten nicht sicher feststellen, ob Ihr Widerruf übermittelt wurde. Ist er eingegangen, erhalten Sie in Kürze die Eingangsbestätigung per E-Mail. Kommt keine an, senden Sie Ihren Widerruf bitte per E-Mail an die folgende Adresse.",
    },
    rateLimited: {
      title: "Zu viele Anfragen",
      text: "Über diese Funktion wurden gerade zu viele Widerrufe gesendet. Ihr Widerruf wurde nicht übermittelt – bitte senden Sie ihn per E-Mail an die folgende Adresse.",
    },
    blocked: {
      title: "Widerruf nicht übermittelt",
      text: "Unser Spamschutz hat die Übermittlung aufgehalten. Ihr Widerruf wurde nicht übermittelt – bitte senden Sie ihn per E-Mail an die folgende Adresse.",
    },
    tooFast: {
      title: "Bitte noch einmal bestätigen",
      text: "Das ging schneller, als unser Spamschutz erlaubt. Ihr Widerruf wurde noch nicht übermittelt – bitte bestätigen Sie ihn noch einmal.",
    },
    invalid: {
      title: "Angaben unvollständig",
      text: "Ihr Widerruf wurde nicht übermittelt, weil Angaben fehlen oder ungültig sind. Bitte prüfen Sie Ihre Angaben.",
    },
    /** The subject of the fallback mailto link; never built from the visitor's input. */
    emailSubject: "Widerruf",
    confirmAgain: "Widerruf erneut bestätigen",
    edit: "Angaben ändern",
  },
} as const;

/** The two e-mails the function sends, as plain text. */
export const withdrawalMail = {
  acknowledgement: {
    subject: "Eingangsbestätigung Ihres Widerrufs",
    greeting: "Guten Tag,",
    intro:
      "hiermit bestätigen wir den Eingang Ihres Widerrufs, den Sie über die Widerrufsfunktion auf unserer Website abgegeben haben.",
    closing: "Mit freundlichen Grüßen",
  },
  notice: {
    subject: (name: string) => `Neuer Widerruf: ${name}`,
    intro:
      "Über die Widerrufsfunktion der Website ist ein Widerruf eingegangen.",
    acknowledgement: {
      sent: "Die Eingangsbestätigung wurde an die angegebene Adresse gesendet.",
      unknown:
        "Ob die Eingangsbestätigung gesendet wurde, ist unklar: Microsoft Graph hat den Versand nicht bestätigt. Bitte im Ordner „Gesendete Elemente“ prüfen und sie sonst von Hand senden.",
      refused:
        "Die Eingangsbestätigung wurde NICHT gesendet: Microsoft Graph hat sie abgelehnt. Bitte die Eingangsbestätigung unverzüglich von Hand senden.",
    },
  },
  receivedAt: "Eingang",
  content: "Inhalt der Widerrufserklärung",
  providerEmail: "E-Mail",
} as const;
