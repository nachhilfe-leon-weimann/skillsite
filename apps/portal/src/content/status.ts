/** The 404 page. */
export const notFoundPage = {
  metadata: {
    title: "Seite nicht gefunden",
  },
  eyebrow: "Fehler 404",
  title: "Seite nicht gefunden.",
  lead: "Diese Seite gibt es im Portal nicht.",
  actions: {
    home: "Zur Übersicht",
  },
};

/** A page that could not be built, most likely because SkillForge did not answer; the session is kept. */
export const errorPage = {
  eyebrow: "Fehler",
  title: "Das hat nicht geklappt.",
  lead: "Die Seite konnte nicht geladen werden. Meist ist SkillForge gerade nicht erreichbar – du bleibst angemeldet.",
  actions: {
    retry: "Erneut versuchen",
  },
};
