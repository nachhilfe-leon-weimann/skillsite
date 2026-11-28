// The page: A4 geometry, the letterhead head (page 1 and following pages) and the footer.
#import "tokens.typ"
#import "type.typ": body-font, heading-font, line-height

// Margins; the top margin includes the head.
#let margin = (top: 30mm, x: 20mm, bottom: 22mm)

// The lockup sizes: the logo tile's width, the gap to the text, the name and tagline sizes. The tile's corner
// radius is a quarter of its width (3 mm at 12 mm); 10 mm is the logo's print minimum.
#let large-lockup = (tile: 12mm, gap: 3.2mm, name: 12.5pt, tagline: 8pt)
#let small-lockup = (tile: 10mm, gap: 3.2mm * 10 / 12, name: 9.5pt, tagline: 7pt)

// The logo tile, then the brand name over the tagline. The tile is the logo with its alternative text; the name and
// tagline are an artifact, so a document's tagged text is its own text only.
#let lockup(brand, tagline, alt, size) = grid(
  columns: 2,
  column-gutter: size.gap,
  align: horizon,
  box(clip: true, radius: size.tile / 4, image("../assets/logo-icon.png", width: size.tile, alt: alt)),
  pdf.artifact(stack(
    text(
      font: heading-font,
      weight: 700,
      size: size.name,
      fill: tokens.ink,
      ..line-height(1.08, font: heading-font),
      brand,
    ),
    text(
      font: body-font,
      size: size.tagline,
      fill: tokens.ink-soft,
      tracking: 0.03em,
      ..line-height(1.08),
      tagline,
    ),
  )),
)

// Page 1: a full-bleed bar in `logo-ink` and a coral gradient line below it. The large lockup is not part of the
// background: `page-setup` places it in the flow, so the logo reaches the tagged PDF with its alternative text.
#let first-head = {
  place(top + left, rect(width: 100%, height: 7mm, fill: tokens.logo-ink))
  place(top + left, dy: 7mm, rect(width: 100%, height: 0.9mm, fill: gradient.linear(tokens.coral, tokens.coral-2)))
}

// The large lockup on page 1, 20 mm from the left and 17.5 mm from the top, placed at the start of the flow.
#let first-lockup(brand, tagline, alt) = place(
  top + left,
  dy: 17.5mm - margin.top,
  lockup(brand, tagline, alt, large-lockup),
)

// Following pages: no bar; the small lockup, the document title on the right and a hairline 3.5 mm below.
#let following-head-top = 12mm
#let following-head(brand, tagline, alt, title) = place(
  top + left,
  dx: margin.x,
  dy: following-head-top,
  block(width: 100% - 2 * margin.x, stack(
    spacing: 3.5mm,
    grid(
      columns: (1fr, auto),
      align: (left + horizon, right + horizon),
      lockup(brand, tagline, alt, small-lockup),
      text(size: 8.5pt, fill: tokens.ink-soft, title),
    ),
    line(length: 100%, stroke: 0.5pt + tokens.line),
  )),
)

// The head of the current page, drawn as the page background: full bleed, and an artifact in the tagged PDF. On
// following pages the small lockup repeats the logo, so it stays an artifact there.
#let page-head(brand, tagline, alt, title) = context {
  if here().page() == 1 { first-head } else { following-head(brand, tagline, alt, title) }
}

// The footer on every page: "<brand> · <domain>" on the left, "<page label> x / y" on the right.
#let page-foot(brand, domain, page-label) = context {
  set text(size: 8.5pt, fill: tokens.ink-soft)
  grid(
    columns: (1fr, auto),
    [#brand · #domain],
    [#page-label #counter(page).display() / #counter(page).final().first()],
  )
}

// The page setup, applied to `body`.
#let page-setup(brand: none, tagline: none, logo-alt: none, domain: none, title: none, page-label: none, body) = {
  set page(
    paper: "a4",
    margin: margin,
    background: page-head(brand, tagline, logo-alt, title),
    footer: page-foot(brand, domain, page-label),
    footer-descent: 30%,
  )
  first-lockup(brand, tagline, logo-alt)
  body
}
