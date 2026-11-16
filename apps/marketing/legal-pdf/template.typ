// The shared layout of the legal PDFs, built by `just legal-pdfs`.
//
// Contact data, section headings, addresses and the effective date come from the site's content modules through
// generated/data.json (src/lib/legal-pdf/data.ts): never write them here. The documents' wording equals /agb
// paragraph by paragraph; src/content/legal/agb-pdf.test.tsx compares both, so markup in the documents and their
// parts stays within what its reader understands (src/lib/legal-pdf/typst-text.ts).

#let data = json("generated/data.json")
#let provider = data.provider
#let site = data.site
#let agb = data.agb

// The site's brand fonts (packages/ui/src/shell/fonts.ts), vendored under fonts/ with their licences.
#let body-font = "Hanken Grotesk"
#let heading-font = "Bricolage Grotesque 96pt"
#let muted = luma(90)
#let rule = 0.4pt + luma(160)

// A whole document: title block, page footer and type.
#let legal-document(title: "", subtitle: none, body) = {
  let (year, month, day) = agb.effectiveDate.split("-").map(int)
  // A fixed date instead of the build time keeps the PDF the same for the same sources.
  set document(
    title: title,
    author: provider.businessName,
    date: datetime(year: year, month: month, day: day),
  )
  set page(
    paper: "a4",
    margin: (x: 2.3cm, top: 2.2cm, bottom: 2.4cm),
    footer: context [
      #set text(size: 8pt, fill: luma(110))
      #provider.businessName · #provider.street · #provider.city · #provider.email
      #h(1fr)
      Seite #counter(page).display() von #counter(page).final().first()
    ],
  )
  set text(font: body-font, size: 10pt, lang: "de", region: "de")
  set par(justify: true, leading: 0.62em, spacing: 0.9em)
  show heading: set text(font: heading-font)
  show heading.where(level: 1): it => block(above: 1.4em, below: 0.7em, text(size: 12pt, weight: "bold", it.body))
  show heading.where(level: 2): it => block(above: 1.1em, below: 0.6em, text(size: 10.5pt, weight: "bold", it.body))

  text(font: heading-font, size: 17pt, weight: "bold", title)
  if subtitle != none {
    v(0.2em)
    text(size: 10pt, fill: muted, subtitle)
  }
  v(0.2em)
  text(size: 9pt, fill: muted)[Stand: #agb.effectiveDateLabel]
  v(0.8em)
  body
}

// A framed block: the withdrawal notice and the model withdrawal form, which must not break across pages.
#let notice-box(breakable: true, body) = block(
  stroke: 0.6pt + luma(150),
  inset: 12pt,
  radius: 3pt,
  width: 100%,
  breakable: breakable,
  body,
)

// The title line inside a notice box.
#let box-title(body) = text(font: heading-font, size: 11pt, weight: "bold", body)

// A link to a page of the site. The site links the word; the PDF prints the address after it.
#let web-link(address, body) = [#link("https://" + address, body) (#address)]

// A line to write on, filling the rest of the line, and a full line of its own.
#let fill-line = box(width: 1fr, line(length: 100%, stroke: rule))
#let write-line = [#v(1.4em) #line(length: 100%, stroke: rule)]

// The small note below the model withdrawal form.
#let form-note(body) = text(size: 9pt, body)
