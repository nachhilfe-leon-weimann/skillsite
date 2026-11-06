/** /zahlung when the payment link is unusable: what happened and the ways to get a new one. */
export const paymentPage = {
  metadata: {
    title: "Rechnung bezahlen",
  },
  eyebrow: "Zahlung",
  title: "Dieser Zahlungslink führt nicht weiter.",
  lead: "Vermutlich ist der Link aus der Rechnung unterwegs abgeschnitten worden. Schreib mir kurz mit deiner Rechnungsnummer – du bekommst sofort einen neuen Link.",
  actions: {
    eMail: "E-Mail schreiben",
    whatsapp: "Über WhatsApp melden",
  },
  /** The link to /kontakt under the contact details. */
  allContacts: "Alle Kontaktwege",
};

/** The 404 page. */
export const notFoundPage = {
  metadata: {
    title: "Seite nicht gefunden",
  },
  eyebrow: "Fehler 404",
  title: "Seite nicht gefunden.",
  lead: "Diese Seite gibt es nicht. Vielleicht hilft dir eine dieser Optionen weiter.",
  actions: {
    home: "Zur Startseite",
    contact: "Kontakt aufnehmen",
  },
};

/** The error page; `global-error.tsx` also names its tab after the eyebrow. */
export const errorPage = {
  eyebrow: "Ein Fehler ist aufgetreten",
  title: "Da ist etwas schiefgelaufen.",
  lead: "Bitte versuch es noch einmal. Wenn es weiterhin klemmt, schreib mir einfach direkt – wir kriegen das hin.",
  actions: {
    retry: "Nochmal versuchen",
    contact: "Kontakt aufnehmen",
  },
};
