// The print kit: the brand's letterhead, typography and print primitives for Typst. README.md documents the API.
//
// The kit holds no brand or business strings: the brand name, tagline, logo alt text, domain, title, date label
// and the labels it prints come in as arguments.
#import "src/tokens.typ"
#import "src/type.typ": text-rules
#import "src/page.typ": page-setup
#import "src/blocks.typ": (
  checkbox, data-table, eyebrow, field, form, note, panel, place-date, signature, title-block,
)

// Fails with a message that names the missing argument.
#let required(value, name) = {
  assert(value != none, message: "print-kit: letterhead needs `" + name + "`")
  value
}

// A document on the brand's letterhead: `#show: letterhead.with(..)`.
//
// - brand, tagline, domain: the lockup's name and tagline, and the footer's "<brand> · <domain>".
// - logo-alt: the logo's alternative text; `auto` uses `brand`.
// - title: the PDF title, the title block's heading and the head of every following page.
// - eyebrow, lead: optional lines above and below the title.
// - date-label: optional, printed as "<labels.date>: <date-label>" in the title block.
// - labels: `(page: "Seite", date: "Stand")`, the words around the page counter and the date label.
// - author: the PDF author. date: the PDF date, a `datetime`; `auto` takes the time of the build, so a fixed
//   date (or `--creation-timestamp`) gives reproducible bytes. PDF/A needs a date.
// - lang, region: the text language, for quotes and the PDF's `/Lang`.
#let letterhead(
  brand: none,
  tagline: none,
  domain: none,
  logo-alt: auto,
  title: none,
  eyebrow: none,
  lead: none,
  date-label: none,
  labels: none,
  author: (),
  date: auto,
  lang: "de",
  region: "DE",
  body,
) = {
  let brand = required(brand, "brand")
  let labels = required(labels, "labels")
  assert(type(labels) == dictionary and "page" in labels, message: "print-kit: `labels` needs a `page` entry")
  assert(date-label == none or "date" in labels, message: "print-kit: `date-label` needs `labels.date`")

  set document(title: required(title, "title"), author: author, date: date)
  // The text rules come first: the page's footer and the page-1 lockup, which the page setup puts in the flow,
  // take their styles from them.
  show: text-rules.with(lang: lang, region: region)
  show: page-setup.with(
    brand: brand,
    tagline: required(tagline, "tagline"),
    logo-alt: if logo-alt == auto { brand } else { logo-alt },
    domain: required(domain, "domain"),
    title: title,
    page-label: labels.page,
  )

  title-block(
    title,
    eyebrow: eyebrow,
    lead: lead,
    as-of: if date-label != none [#labels.date: #date-label],
  )
  body
}
