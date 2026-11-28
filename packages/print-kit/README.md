# Print kit

A [Typst](https://typst.app) kit for branded documents: the letterhead, the typography and the print primitives
(title block, panel, note box, table, form parts). It is self-contained: no dependency on another package, its own
fonts, logo and pinned Typst. It holds no brand or business strings either; the brand name, tagline, logo alt text,
domain, title, date label and the labels it prints are arguments.

The design values (sizes, weights, spacing, colours) are the _Print design_ table of
[`docs/specs/documents.md`](../../docs/specs/documents.md#print-design).

## Layout

| Path                              | Holds                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `lib.typ`                         | the entry point: `letterhead`, the primitives and `tokens`                             |
| `src/tokens.typ`                  | the colours: the web's light values plus the print-only `logo-ink`                     |
| `src/type.typ`                    | the font families, a CSS-like `line-height` and the text rules (body, headings, lists) |
| `src/page.typ`                    | A4 geometry, the head of page 1 and of the following pages, the footer                 |
| `src/blocks.typ`                  | the primitives                                                                         |
| `fonts/`                          | static TTFs with their licences (below)                                                |
| `assets/logo-icon.png`            | the logo tile                                                                          |
| `toolchain.json`, `bin/typst.mjs` | the Typst pin and its runner                                                           |
| `examples/specimen.typ`           | every primitive once, with synthetic text                                              |
| `typst.toml`                      | the manifest for use as a `@local` package                                             |

## Running Typst

`node bin/typst.mjs <typst arguments>` runs the Typst CLI pinned in `toolchain.json` (0.15.1). On first use it
downloads the release tarball for the platform from GitHub into `.cache/` (gitignored), checks its SHA-256 against
the pin before extracting it and keeps it for later runs. A Typst on the `PATH` is never used, and a cached tarball
that does not match the pin stops the runner. It needs Node 22.18 or later and `tar` with xz support (on Debian
`xz-utils`); it runs on macOS (arm64, x64) and Linux (arm64, x64).

Compile with the kit's fonts only, so that every machine typesets the same:

```sh
node bin/typst.mjs compile --root . --font-path fonts --ignore-system-fonts \
  --pdf-standard a-2a,ua-1 examples/specimen.typ specimen.pdf
node bin/typst.mjs compile --root . --font-path fonts --ignore-system-fonts \
  --format png --ppi 144 examples/specimen.typ 'specimen-{0p}.png'
```

`--root` must contain both the document and the kit. A project that installs the kit as a dependency passes its own
directory as the root and imports `/node_modules/<kit>/lib.typ`; the root check is lexical, so a symlinked
`node_modules` works.

To move to another Typst release, change `version` and every `sha256` in `toolchain.json`. The hashes are the
`sha256:` digests GitHub shows for each `typst-<target>.tar.xz` asset of the release; check each against a
downloaded tarball (`shasum -a 256`).

## Using the kit

```typ
#import "/lib.typ": *

#show: letterhead.with(
  brand: "Example Brand",
  tagline: "A short tagline.",
  domain: "example.org",
  title: "Sample document",
  eyebrow: "Sample",
  lead: [One sentence about the document.],
  date-label: "January 2026",
  labels: (page: "Page", date: "As of"),
  author: "Example Brand",
  date: datetime(year: 2026, month: 1, day: 1),
  lang: "en",
  region: none,
)

== 1. A section

Body text with a #link("https://example.org")[link].

#note(label: "Note:")[A filled box that never breaks across pages.]
```

As a package: link (or copy) the kit to `<package dir>/local/print-kit/0.1.0`, compile with
`--package-path <package dir>` and import `@local/print-kit:0.1.0`.

### `letterhead`

`#show: letterhead.with(..)` sets up the page, the text rules and the PDF metadata, then places the title block.
The arguments without a default fail the build when they are missing.

| Argument     | Default | Meaning                                                                              |
| ------------ | ------- | ------------------------------------------------------------------------------------ |
| `brand`      | -       | the name in the lockup and the footer                                                |
| `tagline`    | -       | the line below the name in the lockup                                                |
| `domain`     | -       | the footer's "<brand> · <domain>"                                                    |
| `title`      | -       | the PDF title, the title block's heading and the head of every following page        |
| `labels`     | -       | `(page: "Seite", date: "Stand")`: the words of "Seite 2 / 5" and "Stand: Juli 2026"  |
| `logo-alt`   | `auto`  | the logo's alternative text; `auto` is `brand`                                       |
| `eyebrow`    | `none`  | the small line above the title                                                       |
| `lead`       | `none`  | the line below the title                                                             |
| `date-label` | `none`  | printed as "<labels.date>: <date-label>"; needs `labels.date`                        |
| `author`     | `()`    | the PDF author                                                                       |
| `date`       | `auto`  | the PDF date; `auto` is the time of the build, a `datetime` gives reproducible bytes |
| `lang`       | `"de"`  | the text language: quotes, the PDF's `/Lang`                                         |
| `region`     | `"DE"`  | the text region                                                                      |

Headings: `==` is a section (h2), `===` a subsection (h3); the title is the only level-1 heading.

### Primitives

| Primitive                                     | Draws                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `title-block(title, eyebrow:, lead:, as-of:)` | the title block; `letterhead` places it                                                    |
| `eyebrow(body)`                               | a small label in spaced capitals, such as the title of a group of blocks                   |
| `panel(body)`                                 | a bordered panel; never breaks across pages                                                |
| `note(label: none, body)`                     | a filled note box in 10 pt with a bold label; never breaks across pages                    |
| `data-table(columns: auto, header, ..rows)`   | a table: `data-table(("A", "B"), ("a1", "b1"))`, with a header bar and a bold first column |
| `form(note: none, body)`                      | the parts of a form, kept on one page, with a note in small print                          |
| `field(label, lines: 1)`                      | a label and `lines` writing lines, 9 mm apart                                              |
| `checkbox(label, checked: false)`             | a box before its label                                                                     |
| `place-date(label, value: none)`              | a 70 mm line with its label below; `value` prints a known place and date on it             |
| `signature(label)`                            | a 70 mm line with its label below and room to sign above                                   |
| `tokens`                                      | the colours, as `tokens.ink`, `tokens.coral` and so on                                     |

`place-date` and `signature` have the same height, so they line up in a `grid(columns: (70mm, 70mm), column-gutter: 1fr, ..)`.

## Fonts

Static TTFs from the upstream repositories, not the variable fonts from Google Fonts: Typst names the variable
Bricolage "Bricolage Grotesque 96pt", the static files are "Bricolage Grotesque" and "Hanken Grotesk". The commits are
the ones Google Fonts builds from, so print and web show the same glyphs. Each family ships with its licence, the SIL
Open Font License 1.1.

| Family              | Files (weight)                                | Source                                                                                                                                          |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Bricolage Grotesque | `Bold` (700), `ExtraBold` (800)               | [ateliertriay/bricolage](https://github.com/ateliertriay/bricolage) `fonts/ttf/` at `84745e5b96261ae5f8c6c856e262fe78d1d6efdd` (v1.001)         |
| Hanken Grotesk      | `Regular` (400), `Medium` (500), `Bold` (700) | [marcologous/hanken-grotesk](https://github.com/marcologous/hanken-grotesk) `fonts/ttf/` at `1ab416e82130b2d3ddb7710abf7ceabf07156a13` (v3.014) |

`node bin/typst.mjs fonts --font-path fonts --ignore-system-fonts --variants` lists what Typst sees.

## Tests

`node --test` (in the repository: `pnpm --filter @skillsite/print-kit test`) compiles the specimen as PDF/A-2a and
PDF/UA-1, checks that it embeds only the kit's fonts and that two builds give the same bytes, and checks the
runner: a wrong SHA-256 is refused before extraction, and a Typst on the `PATH` is ignored. The repository's
`tests/print-kit.test.mts` keeps the colours and the logo equal to the website's.
