/** /login. */
export const loginPage = {
  metadata: {
    title: "Anmelden",
  },
  eyebrow: "Portal",
  title: "Anmelden",
  lead: "Melde dich mit deiner E-Mail-Adresse und deinem Passwort an.",
};

/** The login form and its messages, one per reason a login fails. */
export const loginForm = {
  email: "E-Mail-Adresse",
  password: "Passwort",
  submit: "Anmelden",
  submitting: "Anmeldung läuft …",
  failures: {
    /** Every wrong-credential case: unknown address, wrong password, locked or disabled account. */
    invalid_credentials: "E-Mail-Adresse oder Passwort stimmen nicht.",
    throttled:
      "Zu viele fehlgeschlagene Versuche. Bitte warte eine Viertelstunde und versuch es dann noch einmal.",
    not_admin: "Dieses Konto hat keinen Zugang zur Verwaltung.",
    not_configured:
      "Das Portal ist noch nicht mit SkillForge verbunden, darum ist keine Anmeldung möglich.",
    unreachable:
      "SkillForge ist gerade nicht erreichbar. Bitte versuch es gleich noch einmal.",
  },
};

/** The logout in the admin area. */
export const logoutButton = {
  label: "Abmelden",
};
