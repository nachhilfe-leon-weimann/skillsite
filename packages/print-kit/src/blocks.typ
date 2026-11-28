// The print primitives: title block, eyebrow, panel, note box, table and the form parts (field, checkbox,
// place and date, signature).
#import "tokens.typ"
#import "type.typ": line-height

// The accent: a gradient from `coral` to `coral-2`. Besides the page-1 line, only the title's accent stroke uses it.
#let accent = gradient.linear(tokens.coral, tokens.coral-2)

// A small label in spaced capitals: the title block's eyebrow, and the title of a group of blocks.
#let caps-label(body) = text(size: 8pt, weight: 700, tracking: 0.12em, fill: tokens.ink-soft, upper(body))
#let eyebrow(body) = block(caps-label(body))

// The document's title block, 10 mm below the page-1 head. `title` becomes the level-1 heading; `eyebrow`, `lead`
// and `as-of` (such as "Stand: Juli 2026") are optional.
#let title-block(title, eyebrow: none, lead: none, as-of: none) = block(width: 100%, inset: (top: 10mm), below: 9mm, {
  if eyebrow != none { block(below: 3mm, caps-label(eyebrow)) }
  heading(level: 1, title)
  block(above: 5mm, below: 5mm, box(width: 24mm, height: 1.4mm, radius: 1mm, fill: accent))
  if lead != none {
    block(below: 3mm, text(size: 12.5pt, fill: tokens.ink-soft, ..line-height(1.5), lead))
  }
  if as-of != none {
    block(text(size: 10pt, fill: tokens.ink-soft, as-of))
  }
})

// A bordered panel that sets a long passage apart; it never breaks across pages.
#let panel(body) = block(
  width: 100%,
  breakable: false,
  stroke: 0.75pt + tokens.line,
  radius: 3.7mm,
  inset: 5mm,
  body,
)

// A filled note box in 10 pt, with an optional bold label before its content; it never breaks across pages.
#let note(label: none, body) = block(
  width: 100%,
  breakable: false,
  fill: tokens.surface-2,
  radius: 3.7mm,
  inset: (x: 5mm, y: 3.4mm),
  {
    set text(size: 10pt)
    if label != none [#strong(label) ]
    body
  },
)

// A table: a `surface-2` header bar with rounded top corners and caps labels over a 2 px `navy` rule, then rows
// with 1 px `line` separators, no vertical rules and a bold first column.
// `data-table(columns: (1fr, 2fr), ("Header A", "Header B"), ("a1", "b1"), ("a2", "b2"))`
#let data-table(columns: auto, header, ..rows) = {
  let rows = rows.pos()
  let columns = if columns == auto { header.len() } else { columns }
  show table.cell.where(x: 0): set text(weight: 700)
  block(width: 100%, radius: (top: 2.5mm), clip: true, table(
    columns: columns,
    stroke: (_, y) => if y > 1 { (top: 0.75pt + tokens.line) },
    fill: (_, y) => if y == 0 { tokens.surface-2 },
    inset: 3mm,
    align: left,
    table.header(..header.map(label => text(size: 8.2pt, weight: 700, tracking: 0.1em, upper(label)))),
    table.hline(y: 1, stroke: 1.5pt + tokens.navy),
    ..rows.flatten(),
  ))
}

// A form: its parts in order and an optional note in 8.5 pt `ink-soft`; it never breaks across pages.
#let form(note: none, body) = block(width: 100%, breakable: false, {
  body
  if note != none { block(above: 4mm, text(size: 8.5pt, fill: tokens.ink-soft, note)) }
})

// The pitch of the writing lines.
#let field-pitch = 9mm

// A writing line in `line` at the bottom of a `height` tall space.
#let writing-line(height) = block(
  width: 100%,
  height: height,
  above: 0pt,
  below: 0pt,
  align(bottom, line(length: 100%, stroke: 0.75pt + tokens.line)),
)

// A field: its label, then `lines` writing lines, 9 mm apart.
#let field(label, lines: 1) = block(width: 100%, breakable: false, {
  block(below: 0pt, label)
  for _ in range(lines) { writing-line(field-pitch) }
})

// A checkbox before its label; `checked: true` draws a check mark.
#let checkbox(label, checked: false) = {
  let size = 3.4mm
  box(baseline: 0.4mm, rect(
    width: size,
    height: size,
    radius: 0.6mm,
    stroke: 0.75pt + tokens.ink-soft,
    inset: 0pt,
    if checked {
      curve(
        stroke: (paint: tokens.ink, thickness: 1pt, cap: "round", join: "round"),
        curve.move((0.75mm, 1.8mm)),
        curve.line((1.45mm, 2.5mm)),
        curve.line((2.7mm, 0.9mm)),
      )
    },
  ))
  h(2mm)
  label
}

// The room above a signature or a place-and-date line; the same for both, so they line up side by side.
#let signing-room = 12mm

// A 70 mm writing line with its label below in 8.5 pt `ink-soft`, after `height` of room to write in.
#let labelled-line(label, height, value: none) = block(width: 70mm, breakable: false, {
  if value == none { writing-line(height) } else {
    block(width: 100%, height: height, above: 0pt, below: 0pt, align(bottom, block(
      width: 100%,
      inset: (bottom: 1.5mm),
      stroke: (bottom: 0.75pt + tokens.line),
      value,
    )))
  }
  block(above: 1.5mm, text(size: 8.5pt, fill: tokens.ink-soft, label))
})

// The place and date line, such as "Ort, Datum"; `value` prints a known place and date on the line.
#let place-date(label, value: none) = labelled-line(label, signing-room, value: value)

// A signature line with room to sign above it.
#let signature(label) = labelled-line(label, signing-room)
