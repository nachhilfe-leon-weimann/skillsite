// The kit's specimen: every primitive once, with synthetic text. The kit's test compiles it.
//
//   node bin/typst.mjs compile --root . --font-path fonts --ignore-system-fonts \
//     --pdf-standard a-2a,ua-1 examples/specimen.typ
#import "../lib.typ": *

#show: letterhead.with(
  brand: "Beispielmarke",
  tagline: "Ein Slogan als Platzhalter.",
  domain: "example.org",
  title: "Musterdokument",
  eyebrow: "Muster",
  lead: [Ein Beispieldokument mit jedem Baustein des Druck-Kits, gesetzt aus Platzhaltertext.],
  date-label: "Januar 2026",
  labels: (page: "Seite", date: "Stand"),
  author: "Beispielmarke",
  date: datetime(year: 2026, month: 1, day: 1),
)

== 1. Fließtext und Links

Dieser Absatz zeigt den Fließtext: elf Punkt auf eins Komma sechs, im Flattersatz und ohne automatische Trennung.
Ein Satz folgt dem anderen, damit mehrere Zeilen entstehen und der Zeilenabstand sichtbar wird.
Ein #link("https://example.org/beispiel")[Link auf eine Beispielseite] ist unterstrichen und so dunkel wie der Text.

#text(weight: 500)[Ein Absatz mit mittlerer Strichstärke hebt einen Hinweis hervor, ohne fett zu werden.]

Umlaute und Satzzeichen: ä, ö, ü, Ä, Ö, Ü, ß, „Anführungszeichen“, ‚einfache‘, Gedankenstrich – und Bindestrich-Wörter.

== 2. Listen

Eine Liste mit runden Punkten:

- Ein kurzer Eintrag.
- Ein längerer Eintrag, der über das Zeilenende hinausläuft, damit die Einrückung der zweiten Zeile zu sehen ist.
- Ein dritter Eintrag.

=== 2.1 Eine Überschrift dritter Ebene

Unter einer Überschrift dritter Ebene steht wieder Fließtext.
Der Abstand zum Absatz darüber ist kleiner als vor einer Überschrift zweiter Ebene.

#eyebrow[Gruppentitel]

Ein Gruppentitel ordnet die folgenden Blöcke, ohne eine Überschrift zu sein.

== 3. Hinweisbox und Rahmen

#note(label: "Hinweis:")[Eine Hinweisbox in zehn Punkt, mit fettem Etikett vor dem Text. Sie bricht nie über eine Seite.]

#note(label: "Beispielliste")[
  - Erster Punkt der Liste.
  - Zweiter Punkt der Liste.
]

#panel[
  === Ein Abschnitt im Rahmen

  Ein Rahmen setzt einen längeren Abschnitt vom übrigen Text ab.
  Er bricht nie über eine Seite und trägt keine Füllfarbe.

  Ein zweiter Absatz im Rahmen zeigt den Absatzabstand innerhalb des Rahmens.
]

== 4. Tabelle

#data-table(
  columns: (1fr, 2fr),
  ("Begriff", "Beschreibung"),
  ("Erster", "Die erste Spalte ist fett, die Zeilen trennt eine feine Linie."),
  ("Zweiter", "Senkrechte Linien gibt es nicht."),
  ("Dritter", "Der Kopf trägt Großbuchstaben mit Sperrung."),
)

== 5. Formular

Ein Formular hält seine Teile zusammen auf einer Seite.

#form(note: [(\*) Unzutreffendes streichen.])[
  #field[Name (\*)]
  #field(lines: 2)[Anschrift]

  #let states = (checked: "angekreuzt", unchecked: "nicht angekreuzt")
  #checkbox(states: states)[Option eins] #h(8mm) #checkbox(checked: true, states: states)[Option zwei]

  #grid(
    columns: (70mm, 70mm),
    column-gutter: 1fr,
    place-date("Ort, Datum"), signature("Unterschrift"),
  )

  #place-date("Ort, Datum", value: "Musterstadt, 1. Januar 2026")
]

== 6. Weitere Seiten

Folgeseiten tragen das kleine Logo, rechts den Titel des Dokuments und darunter eine Haarlinie.

#for n in range(1, 6) [
  Absatz #n: Ein weiterer Absatz mit Platzhaltertext füllt die Seite, damit das Dokument auf eine Folgeseite läuft.
  Ein zweiter Satz verlängert ihn, und ein dritter Satz sorgt für eine weitere Zeile im Flattersatz.

]
