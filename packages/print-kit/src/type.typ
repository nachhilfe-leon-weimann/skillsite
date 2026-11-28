// Typography: the two families, a CSS-like line height and the text rules of a document.
#import "tokens.typ"

// Headings, the title and the brand name.
#let heading-font = "Bricolage Grotesque"
// Body text and everything else.
#let body-font = "Hanken Grotesk"

// Ascender, descender (hhea = typo metrics) and x-height of each family in em, read from the files in `fonts/`.
#let metrics = (
  "Bricolage Grotesque": (ascent: 0.93, descent: 0.27, x-height: 0.525),
  "Hanken Grotesk": (ascent: 1.0, descent: 0.303, x-height: 0.493),
)

// Text edges for a CSS-like line height: each line box is `factor` em tall, with the leading split evenly above
// and below the glyphs, and paragraphs set `leading: 0pt`. Gaps between blocks then measure between line boxes,
// as margins do on the web. Use it as `set text(..line-height(1.6))`.
#let line-height(factor, font: body-font) = {
  let m = metrics.at(font)
  let half = (factor - m.ascent - m.descent) / 2
  (top-edge: (m.ascent + half) * 1em, bottom-edge: -(m.descent + half) * 1em)
}

// The text rules of a document: body text, headings, lists and links.
#let text-rules(lang: "de", region: "DE", body) = {
  // Body: Hanken 400 11 pt / 1.6, ragged right, no automatic hyphenation (a hyphen at a line end is then always
  // a real one in the extracted text).
  set text(
    font: body-font,
    weight: 400,
    size: 11pt,
    fill: tokens.ink,
    lang: lang,
    region: region,
    hyphenate: false,
    ..line-height(1.6),
  )
  set par(justify: false, leading: 0pt, spacing: 3mm)
  set block(spacing: 3mm)

  // Headings: the document title is level 1 (`title-block`); h2 and h3 follow. Headings stay with the next block.
  show heading: set text(font: heading-font, weight: 700, fill: tokens.ink)
  let title-height = line-height(1.04, font: heading-font)
  show heading.where(level: 1): set text(size: 30pt, weight: 800, tracking: -0.025em, ..title-height)
  show heading.where(level: 1): set block(above: 0pt, below: 0pt)
  show heading.where(level: 2): set text(size: 14pt, tracking: -0.01em, ..line-height(1.25, font: heading-font))
  show heading.where(level: 2): set block(above: 9mm, below: 3mm)
  show heading.where(level: 3): set text(size: 12pt, ..line-height(1.25, font: heading-font))
  show heading.where(level: 3): set block(above: 6mm, below: 2mm)

  // Lists: a round 1.5 mm bullet in `ink-soft`, centred on the x-height; the text starts 5 mm in.
  let x-height = metrics.at(body-font).x-height * 1em
  set list(
    marker: box(baseline: 0.75mm - x-height / 2, circle(radius: 0.75mm, fill: tokens.ink-soft, stroke: none)),
    indent: 0mm,
    body-indent: 5mm - 1.5mm,
    spacing: 1.6mm,
  )

  // Links: `ink`, underlined. Coral is never a text colour.
  show link: set text(fill: tokens.ink)
  show link: underline

  body
}
