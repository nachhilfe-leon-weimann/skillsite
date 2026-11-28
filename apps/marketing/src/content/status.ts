/**
 * /zahlung: the field for the invoice number, and one status per answer of the
 * lookup. Every status but the form ends in the contact ways (`actions`,
 * `allContacts`).
 */
export const paymentPage = {
  metadata: {
    title: "Rechnung bezahlen",
  },
  eyebrow: "Zahlung",
  /** No invoice number yet. */
  form: {
    title: "Rechnung online bezahlen",
    lead: "Gib deine Rechnungsnummer ein.",
    label: "Rechnungsnummer",
    placeholder: "RE-1234",
    submit: "Weiter zu PayPal",
  },
  /** An invoice number that cannot be one: the link was cut or edited on its way. */
  malformed: {
    title: "Dieser Zahlungslink führt nicht weiter.",
    lead: "Vermutlich ist der Link aus der Rechnung unterwegs abgeschnitten worden. Schreib mir kurz mit deiner Rechnungsnummer – du bekommst sofort einen neuen Link.",
  },
  /** This customer pays by bank transfer only; the reference is the visitor's number. */
  blocked: {
    title: "Bitte per Überweisung zahlen.",
    lead: (invoice: string) =>
      `Nutze den GiroCode oder die Bankdaten auf der Rechnung, Verwendungszweck: ${invoice}.`,
  },
  /** Nothing left to pay. */
  paid: {
    title: "Diese Rechnung ist schon bezahlt. Danke!",
  },
  /** No payable invoice under the number; the field again, before the contact ways. */
  notPayable: {
    title: "Diese Rechnung finde ich nicht.",
    lead: "Prüf die Nummer auf deiner Rechnung oder schreib mir kurz.",
  },
  /** The lookup failed: no redirect without an answer. */
  unavailable: {
    title: "Die Zahlung ist gerade nicht erreichbar.",
    lead: "Versuch es gleich noch einmal oder überweise mit dem GiroCode auf deiner Rechnung.",
  },
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
