// The brand's colours for print: the light values of the web's design tokens, under the same names, plus
// `logo-ink`, which exists for print only. A drift test keeps every colour except `logo-ink` equal to its light
// value in the web's tokens; keep one `#let <name> = rgb(...)` per line.
//
// Import this file as a module (`#import "tokens.typ"`): `line` would shadow Typst's `line` function.

// Text.
#let ink = rgb("#16293d")
#let ink-soft = rgb("#55677a")

// Surfaces and rules.
#let surface-2 = rgb("#f4ece1")
#let line = rgb(22, 41, 61, 12%)
#let navy = rgb("#13283f")

// Accent: only in the page-1 line and the title block's accent stroke.
#let coral = rgb("#ff6a45")
#let coral-2 = rgb("#ff9248")

// Print only: the darkest tone of the logo tile, for the page-1 bar.
#let logo-ink = rgb("#010e1e")
