import { legalContact } from "@/content/legal-contact";
import { numberedSections } from "@/lib/numbered-sections";

export const privacyPolicyEffectiveDate = new Date("2026-07-14");

export const privacyContact = {
  email: legalContact.email,
  phone: legalContact.phone,
};

/** Own domains – kept central so they render identically everywhere. */
export const siteDomain = "nachhilfe.leonweimann.de";
export const analyticsDomain = "insights.leonweimann.de";

/** Section registry of the privacy policy: order, numbering, navigation labels and headings. */
export const privacySections = numberedSections([
  {
    id: "verantwortlicher",
    label: "Verantwortlicher",
    title: "Verantwortlicher",
  },
  {
    id: "grundsaetze",
    label: "Allgemeine Grundsätze",
    title: "Allgemeine Grundsätze",
  },
  {
    id: "hosting",
    label: "Hosting und Server-Logfiles",
    title: "Hosting und Server-Logfiles",
  },
  {
    id: "website",
    label: "Besuch der Website",
    title: "Datenverarbeitung beim Besuch der Website",
  },
  {
    id: "webanalyse",
    label: "Webanalyse mit Umami",
    title: "Webanalyse mit Umami",
  },
  {
    id: "nachhilfe",
    label: "Nachhilfebetrieb",
    title: "Datenverarbeitung im Nachhilfebetrieb",
  },
  {
    id: "eigene-software",
    label: "SkillForge und SkillBot",
    title: "Eigene Software: SkillForge und SkillBot",
  },
  {
    id: "minderjaehrige",
    label: "Minderjährige",
    title: "Minderjährige Lernende",
  },
  {
    id: "weitergabe",
    label: "Weitergabe und Drittland",
    title: "Weitergabe von Daten und Drittlandübermittlung",
  },
  {
    id: "speicherdauer",
    label: "Speicherdauer",
    title: "Speicherdauer",
  },
  {
    id: "rechte",
    label: "Ihre Rechte und Aufsichtsbehörde",
    title: "Ihre Rechte und Aufsichtsbehörde",
  },
  {
    id: "widerspruch",
    label: "Widerspruchsrecht",
    title: "Widerspruchsrecht (Art. 21 DSGVO)",
  },
  {
    id: "datensicherheit",
    label: "Datensicherheit",
    title: "Datensicherheit",
  },
  {
    id: "aktualitaet",
    label: "Aktualität und Änderung",
    title: "Aktualität und Änderung dieser Datenschutzerklärung",
  },
]);

/** Canonical data-processing-agreement sentence – identical everywhere. */
export function dpaSentence(entity: string): string {
  return `Mit ${entity} besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.`;
}

/** Standard lawful basis for contract processing – consistent wording. */
export const lawfulBasisContract =
  "Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung und -durchführung)";

export const logFileItems = [
  "IP-Adresse des anfragenden Geräts",
  "Datum und Uhrzeit des Zugriffs",
  "aufgerufene URL und HTTP-Methode",
  "HTTP-Statuscode und übertragene Datenmenge",
  "Referrer-URL (zuvor besuchte Seite)",
  "User-Agent (Browser und Betriebssystem)",
];

export const logFilePurposes = [
  "Auslieferung der Website und stabiler Verbindungsaufbau",
  "Systemsicherheit und Erkennung von Missbrauch",
  "Fehleranalyse und Sicherstellung des Betriebs",
  "administrative Zwecke",
];

export const hostingProviders = [
  {
    name: "Hostinger International Ltd.",
    shortName: "Hostinger",
    seat: "61 Lordou Vironos Str., 6023 Larnaca, Zypern",
    services:
      "Virtueller Server (VPS) für diese Website, SkillForge und die Webanalyse Umami; Serverstandort Frankfurt am Main",
    transferNote: `Die Verarbeitung findet innerhalb der EU statt. ${dpaSentence(
      "Hostinger International Ltd.",
    )}`,
    privacyUrl: "https://www.hostinger.com/legal/privacy-policy",
  },
  {
    name: "Cybrancee (How About Group Ltd)",
    shortName: "Cybrancee",
    seat: "4th Floor, Silverstream House, 45 Fitzroy Street, London W1T 6EB, Vereinigtes Königreich",
    services: "Hosting des Discord-Bots SkillBot",
    transferNote: `Die Übermittlung in das Vereinigte Königreich erfolgt auf Grundlage des Angemessenheitsbeschlusses der EU-Kommission (Art. 45 DSGVO). ${dpaSentence(
      "der How About Group Ltd",
    )}`,
    privacyUrl: "https://cybrancee.com/client/privacy-policy.php",
  },
];

export const umamiCollectedData = [
  "aufgerufene Seiten und Zeitpunkt des Aufrufs",
  "Referrer-URL (Herkunftsseite)",
  "Browser, Betriebssystem und Gerätetyp",
  "Bildschirmauflösung und Sprache",
  "Herkunftsland (aus der IP-Adresse abgeleitet; die IP-Adresse selbst wird nicht gespeichert)",
];

export const externalPlatformPrivacyLinks = [
  { label: "Discord", href: "https://discord.com/privacy" },
  {
    label: "WhatsApp",
    href: "https://www.whatsapp.com/legal/privacy-policy-eea",
  },
  {
    label: "Instagram",
    href: "https://privacycenter.instagram.com/policy/",
  },
  { label: "YouTube", href: "https://policies.google.com/privacy" },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/legal/page/eea/privacy-policy/de",
  },
  {
    label: "GitHub",
    href: "https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement",
  },
];

export const skillForgeDataItems = [
  "Stammdaten (Name, Kontaktdaten von Lernenden und Erziehungsberechtigten)",
  "Unterrichtsfächer, Termine und Unterrichtszeiten",
  "abrechnungsbezogene Daten",
];

export const skillBotDataItems = [
  "Discord-Benutzer-IDs und Benutzernamen",
  "Server- und Kanal-IDs",
  "Befehls- und Interaktionsdaten",
  "Nachrichteninhalte, soweit sie für Bot-Funktionen erforderlich sind",
  "technische Protokolldaten",
];

export const dataRecipientCategories = [
  "Auftragsverarbeiter nach Art. 28 DSGVO: Hosting (Hostinger, Cybrancee), Terminverwaltung (Cal.com), Zeiterfassung und Buchhaltung (Clockodo, sevDesk), Kommunikation (Microsoft)",
  "eigenständig Verantwortliche: PayPal, Kreditinstitute, Kleinanzeigen sowie die verlinkten Plattformen",
  "Behörden und öffentliche Stellen, soweit eine gesetzliche Verpflichtung besteht",
];

export const retentionItems = [
  "Server-Logfiles: kurzfristig, automatische Rotation innerhalb weniger Tage",
  "IP-Adressen zur Missbrauchsabwehr bei Formular- und Buchungsanfragen: höchstens 24 Stunden, ausschließlich im Arbeitsspeicher",
  "Umami-Statistikdaten: pseudonymisiert; eine Wiedererkennung einzelner Besucher über den Monatswechsel hinaus ist ausgeschlossen",
  "Kontakt- und Buchungsanfragen: bis zur Erledigung, danach Löschung, sofern keine gesetzlichen Aufbewahrungspflichten bestehen",
  "Vertrags- und Abrechnungsdaten: für die Dauer der Vertragsdurchführung, anschließend im Rahmen der gesetzlichen Aufbewahrungsfristen (§ 147 AO, § 257 HGB)",
  "Daten in SkillForge und SkillBot: für die Dauer der Zusammenarbeit, danach Löschung, sofern keine gesetzlichen Aufbewahrungspflichten bestehen",
];

export const userRights = [
  "Auskunft über Ihre gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO)",
  "unrichtige Daten berichtigen zu lassen (Art. 16 DSGVO)",
  "die Löschung Ihrer Daten zu verlangen, soweit keine gesetzlichen Pflichten entgegenstehen (Art. 17 DSGVO)",
  "die Verarbeitung einschränken zu lassen (Art. 18 DSGVO)",
  "Ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten (Art. 20 DSGVO)",
  "erteilte Einwilligungen mit Wirkung für die Zukunft zu widerrufen (Art. 7 Abs. 3 DSGVO)",
  "sich bei einer Aufsichtsbehörde zu beschweren (Art. 77 DSGVO)",
];

export const supervisoryAuthority = {
  name: "Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg",
  street: "Lautenschlagerstraße 20",
  city: "70173 Stuttgart",
  phone: "+49 711 615541-0",
  email: "poststelle@lfdi.bwl.de",
  url: "https://www.baden-wuerttemberg.datenschutz.de",
};
