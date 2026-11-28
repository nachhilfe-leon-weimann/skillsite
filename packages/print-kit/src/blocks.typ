// The print primitives: title block, eyebrow, panel, note box, table and the form parts (field, checkbox,
// place and date, signature).
#import "tokens.typ"
#import "type.typ": line-height

// The accent: a gradient from `coral` to `coral-2`. Besides the page-1 line, only the title's accent stroke uses it.
#let accent = gradient.linear(tokens.coral, tokens.coral-2)

// A small label in spaced capitals: the title block's eyebrow, and the title of a group of blocks. As a group
// title it stays with the next block, like a heading, so it never ends a page alone.
#let caps-label(body) = text(size: 8pt, weight: 700, tracking: 0.12em, fill: tokens.ink-soft, upper(body))
#let eyebrow(body) = block(sticky: true, caps-label(body))

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

// A checkbox before its label; `checked: true` draws a check mark. The box is an image whose alternative text
// names its state, so the tagged PDF and a screen reader tell a ticked box from an empty one: `states` is
// `(checked: "...", unchecked: "...")`, the words for both states.
#let checkbox(label, checked: false, states: none) = {
  if states == none { panic("print-kit: checkbox needs `states`") }
  assert(
    type(states) == dictionary and "checked" in states and "unchecked" in states,
    message: "print-kit: checkbox `states` needs `checked` and `unchecked`",
  )
  // A 3.4 mm box with a 0.6 mm radius and a 0.75 pt `ink-soft` stroke; the check mark in 1 pt `ink`, as `rect`
  // and `curve` drew them before. All lengths are in mm. The stroke sits on the box's edge, so the drawing reaches
  // `pad` beyond it on each side; the radius is the stroke's outer edge, as in a Typst `rect`.
  let size = 3.4
  let stroke = 0.75 / 72 * 25.4
  let pad = stroke / 2
  let view = str(size + stroke)
  // The drawing is shifted by `pad` instead of starting the view box at -pad: `str` writes a negative number with
  // a Unicode minus, which SVG does not read.
  let svg = (
    "<svg xmlns='http://www.w3.org/2000/svg' width='" + view + "mm' height='" + view + "mm' viewBox='0 0 " + view
      + " " + view + "'><g transform='translate(" + str(pad) + " " + str(pad) + ")' fill='none'>"
      + "<rect width='" + str(size) + "' height='" + str(size) + "' rx='" + str(0.6 - pad) + "' stroke='"
      + tokens.ink-soft.to-hex() + "' stroke-width='" + str(stroke) + "'/>"
      + if checked {
        (
          "<path d='M0.75 1.8 L1.45 2.5 L2.7 0.9' stroke='" + tokens.ink.to-hex() + "' stroke-width='"
            + str(1 / 72 * 25.4) + "' stroke-linecap='round' stroke-linejoin='round'/>"
        )
      } else { "" }
      + "</g></svg>"
  )
  box(baseline: 0.4mm, width: size * 1mm, height: size * 1mm, place(
    top + left,
    dx: -pad * 1mm,
    dy: -pad * 1mm,
    image(
      bytes(svg),
      format: "svg",
      width: (size + stroke) * 1mm,
      height: (size + stroke) * 1mm,
      alt: if checked { states.checked } else { states.unchecked },
    ),
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
