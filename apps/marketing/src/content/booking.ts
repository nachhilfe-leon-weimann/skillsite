/** Follows a slot's "HH:mm" time. */
const timeSuffix = " Uhr";

/** Texts of the booker that are not part of an event's configuration. */
export const bookerText = {
  /** Accessible name of the duration select (not shown). */
  durationLabel: "Dauer",
  /** A duration in minutes, e.g. in the duration select. */
  minutes: (count: number) => `${count} Minuten`,
  timeSuffix,
  /** The chosen slot: its day label and its "HH:mm" time. */
  slotSummary: (day: string, time: string) => `${day} – ${time}${timeSuffix}`,

  aside: {
    eyebrow: "Buchung",
    summaryEyebrow: "Dein Termin",
    /** Shown for the paid lesson only. */
    cancellationNote:
      "Bis 24 Stunden vorher kostenfrei verschieben oder absagen.",
  },

  calendar: {
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    noneThisMonth:
      "In diesem Monat sind keine Termine frei. Schau im nächsten Monat nach.",
    pickDay: "Wähle einen farbig markierten Tag, um freie Zeiten zu sehen.",
    slotsHeading: "Freie Uhrzeiten",
  },

  unavailable: {
    error: {
      title: "Termine konnten nicht geladen werden",
      text: "Das hat gerade nicht geklappt. Bitte versuch es noch einmal.",
      retry: "Erneut versuchen",
    },
    unconfigured: {
      title: "Online-Terminwahl gerade nicht verfügbar",
      text: "Schreib mir einfach direkt – wir finden zusammen einen passenden Termin.",
    },
  },

  result: {
    pending: {
      title: "Termin wird gebucht …",
      text: "Einen Moment – die Buchung wird bestätigt.",
    },
    confirmed: {
      title: "Termin gebucht!",
      summaryLabel: "Dein Termin",
      text: {
        kennenlernen:
          "Ich rufe dich zum vereinbarten Termin an. Die Bestätigung kommt per E-Mail.",
        nachhilfe:
          "Die Terminbestätigung kommt per E-Mail. Die Einwahl richtet sich nach der gewählten Plattform.",
      },
      action: {
        kennenlernen: "Fertig",
        nachhilfe: "Weiteren Termin buchen",
      },
    },
    blockedTitle: "Termin nicht gebucht",
    rateLimitedTitle: "Zu viele Anfragen",
    slotTakenTitle: "Termin schon vergeben",
    failedTitle: "Das hat nicht ganz geklappt",
    /** Shown when the request itself failed, or a failure came without text. */
    genericFailure:
      "Die Buchung hat nicht geklappt. Bitte versuch es erneut oder schreib mir direkt.",
    resend: "Erneut senden",
    chooseAnother: "Anderen Termin wählen",
  },

  /** The way out when booking online cannot help: the contact page. */
  directContact: "Direkt anfragen",
} as const;

/** The copy of /termin around the booker: metadata, intro, the booker's heading and the way in for newcomers. */
export const bookingPage = {
  metadata: {
    title: "Termin buchen",
    description:
      "Für bestehende Schüler:innen: freie Termine online buchen und bis 24 Stunden vorher kostenfrei verschieben oder absagen.",
  },
  header: {
    eyebrow: "Termin buchen",
    title: "Buche deine nächste Nachhilfestunde.",
    lead: "Du bist schon dabei? Wähle deinen nächsten freien Termin direkt im Kalender. Bis 24 Stunden vorher kannst du kostenfrei verschieben oder absagen.",
  },
  booker: {
    title: "Nachhilfestunde buchen",
    subtitle:
      "Such dir einen freien Termin aus – wöchentlich oder nach Bedarf.",
  },
  /** The line under the booker; `text` is followed by the link to the first meeting. */
  newcomer: {
    text: "Du nimmst noch keine Nachhilfe bei mir?",
    link: "Starte mit dem kostenlosen Erstgespräch",
  },
};
