import { trustLine } from "@/content/site";

const CONTACT_EMAIL = "nachhilfe@leonweimann.de";
const CONTACT_WHATSAPP = "+49 7824 6190305";
const CONTACT_WHATSAPP_URL = "https://wa.me/message/LN3P6IQ7LDPQH1";

export type ContactDetailKey = "eMail" | "whatsapp";

export type ContactDetail = {
  key: string;
  label: string;
  content: string;
  href: string;
};

export const contactDetails = {
  eMail: {
    key: "eMail",
    label: "E-Mail",
    content: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
  whatsapp: {
    key: "whatsapp",
    label: "WhatsApp",
    content: CONTACT_WHATSAPP,
    href: CONTACT_WHATSAPP_URL,
  },
} satisfies Record<ContactDetailKey, ContactDetail>;

/** The copy of /kontakt around the contact details: metadata, intro, the three cards, the first meeting. */
export const contactPage = {
  metadata: {
    title: "Kontakt",
    description:
      "Schreib mir per WhatsApp oder E-Mail. Meistens antworte ich noch am selben Tag. Das kostenlose Erstgespräch kannst du direkt buchen.",
  },
  header: {
    eyebrow: "Kontakt",
    title: "Schreib mir einfach.",
    lead: `Eine kurze Nachricht reicht – meistens antworte ich noch am selben Tag. ${trustLine}`,
  },
  /** The coral card: WhatsApp, its button label and the note beside the QR code. */
  whatsapp: {
    eyebrow: "Am liebsten per WhatsApp",
    title: "Schreib mir auf WhatsApp.",
    text: "Über WhatsApp erreichst du mich am schnellsten. Meistens antworte ich noch am selben Tag.",
    action: "Jetzt anschreiben",
    qrNote: "Oder den QR-Code mit dem Handy scannen.",
  },
  /** The e-mail card; its title is the address. */
  eMail: {
    eyebrow: "E-Mail",
    text: "Du möchtest dein Anliegen ausführlicher schildern? Schreib mir gern eine E-Mail.",
  },
  /** The card that leads to /online-lernen. */
  classroom: {
    eyebrow: "Discord und Microsoft Teams",
    title: "Unser Klassenzimmer",
    text: "Unterricht, Materialien und kurze Fragen. Mehr erfahren",
  },
  /** The section above the first-meeting booker, and the booker's own heading. */
  firstMeeting: {
    eyebrow: "Erstgespräch",
    title: "Lernen wir uns kennen.",
    text: "Such dir einen freien Termin aus. Im kostenlosen, telefonischen Erstgespräch klären wir Situation, Fach und Ziel – ganz unverbindlich. Eltern sind herzlich willkommen.",
    booker: {
      title: "Kostenloses Erstgespräch",
      subtitle: "Kostenlos und unverbindlich – ich rufe dich an.",
    },
  },
};
