# Spec: Documents (legal texts from one Markdown source, for the website and as PDF)

> Status: Accepted, 2026-11-28 - A0 in review. The maintainer accepted every decision and answered the open
> questions on 2026-11-28.
> Builds on [`foundation-refactor.md`](foundation-refactor.md): its module rules, foundation E-12 (the manual look
> check) and V7, which this arc supersedes for legal prose. This spec is also the decision record for the arc. Its
> decision numbers are its own; the foundation refactor's are cited as "foundation E-12". Facts marked _(probed)_
> were run on 2026-11-28 in scratch workspaces against Typst 0.15.1, Next.js 16.4.5, remark-directive 4.0.0,
> Prettier 3.9.10 and veraPDF 1.30.4; everything else is a plan.

## Problem statement

The AGB, the privacy policy and the Impressum are JSX (`apps/marketing/src/content/legal/*.tsx`, 907 lines).
Their numbering and navigation come from hand-kept registries (`content/agb.ts`, `content/privacy.ts`,
`lib/numbered-sections.ts`), and the privacy policy pulls half of its sentences from data arrays in
`privacy.ts`. That costs three things:

- **No file.** The repository builds no file of the terms, the withdrawal notice or the privacy policy. The site
  offers them as pages only, so a copy for an e-mail attachment has to be made by hand.
- **A text change is a code change.** A sentence lives inside JSX, wrapped by Prettier, next to component markup.
  A diff of a wording change shows markup churn, and a lawyer cannot read the source.
- **The structure is kept twice.** Section ids, numbers and navigation labels live in a registry and again in
  `<AgbSection id>` calls. The booking records the AGB version from a date constant in `content/agb.ts`.

## Goals

1. **One source per legal text:** Markdown in `packages/documents/content/`, one sentence per line.
2. **Parsed once:** one pipeline resolves placeholders, numbers, section references, partials and dates. It
   validates the result and writes one JSON tree per document. No renderer resolves anything.
3. **Two renderers of the same tree:** React renders `/agb`, `/datenschutz` and `/impressum` at build time, and
   they look exactly as today. Typst reads the JSON with `json()` and typesets PDFs in the brand's print design.
4. **PDFs for the AGB, the withdrawal notice and the privacy policy.** They are built with every release, served
   at `/agb.pdf`, `/widerruf.pdf` and `/datenschutz.pdf`, and linked from the pages' heads.
5. **A print kit that knows nothing of skillsite**, so that SkillForge can later typeset its own documents with
   it.

## Non-goals

- **Any change of wording**: not a word, punctuation mark, link or heading. New versions of the texts come
  afterwards in their own PR, and so do the open PRs that revise them.
- Documents generated at runtime or per customer (time sheets, invoices), and SkillForge's use of the print kit.
- The electronic withdrawal function (§ 356a BGB), mail sending, attaching PDFs automatically, the portal app and
  fillable PDF form fields.
- Typst markup generated from text (`cmarker`, escaping). Text reaches Typst only as JSON strings.
- A visual-regression tool. The look stays the maintainer's manual check (foundation E-12).

## Decisions

Rows dated _brief_ were set by the maintainer's brief of 2026-11-28. Rows dated _maintainer_ were proposed in this
spec and accepted by the maintainer on 2026-11-28.

| #    | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Date                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| E-01 | The text basis is `origin/main` as it is live. This arc changes the system only; a later PR changes texts. Open PRs that change legal texts are no basis and no stack base. Drafts outside the repository are never opened or read.                                                                                                                                                                                                                                                                                                                                                                           | 2026-11-28, brief      |
| E-02 | Two packages. `@skillsite/print-kit` holds the brand's Typst layout, letterhead, fonts and primitives, with no dependency on anything in skillsite. `@skillsite/documents` holds the content, parser, registry, validation, JSON build, Typst walker and PDF build.                                                                                                                                                                                                                                                                                                                                           | 2026-11-28, brief      |
| E-03 | Markdown is parsed with unified/remark (`remark-gfm`, `remark-frontmatter`, `remark-directive`) once, into a zod-validated JSON tree per document. The app imports the JSON at build time, and Typst reads it with `json()`.                                                                                                                                                                                                                                                                                                                                                                                  | 2026-11-28, brief      |
| E-04 | The registry is the node schemas in `packages/documents/src/schema/`: every node type is declared there once. React and Typst each map every declared type to a renderer. The React map is typed `{ [T in NodeType]: … }`, so a missing renderer is a type error. A test proves that the Typst walker handles every declared type and fails on an unknown one. The set covers today's texts and nothing more. The React map stays in the app on purpose: how a document looks on the web is the site's style, and the `Doc*` components serve other text pages too. The package holds data and PDF, no React. | 2026-11-28, maintainer |
| E-05 | Typst runs as the pinned **CLI binary 0.15.1**, verified by SHA-256 per platform, not through an npm compiler. _(probed)_ The binary gives identical PDF bytes on macOS arm64, Linux amd64 and Linux arm64, exports PNG for the page review, supports `--ignore-system-fonts`, and combines PDF/A with PDF/UA. The npm compiler's stable release (0.7.0) embeds Typst 0.14.2, cannot ignore system fonts, has no PNG output and takes one PDF standard only.                                                                                                                                                  | 2026-11-28, maintainer |
| E-06 | The pin lives in `packages/print-kit/toolchain.json`: the version and the SHA-256 per target triple. The kit then carries its own toolchain when SkillForge takes it over. `print-kit/bin/typst.mjs` is dependency-free Node: it downloads the release tarball into a gitignored cache, checks the hash and runs the binary. Local, CI and Docker use this one runner, and a Typst on the `PATH` is ignored.                                                                                                                                                                                                  | 2026-11-28, maintainer |
| E-07 | `documents` depends on `"@skillsite/print-kit": "workspace:*"`. Typst runs with `--root packages/documents`, imports `/node_modules/@skillsite/print-kit/lib.typ` and gets `--font-path node_modules/@skillsite/print-kit/fonts --ignore-system-fonts`. _(probed: the root check is lexical, so the pnpm symlink works.)_ The kit also carries a `typst.toml`, so it works as a `@local` package as well.                                                                                                                                                                                                     | 2026-11-28, maintainer |
| E-08 | Fonts are static OFL TTFs from the upstream repositories: Bricolage Grotesque 700/800 and Hanken Grotesk 400/500/700, each family with its `OFL.txt`. Not the Google variable fonts: Typst names the variable Bricolage "Bricolage Grotesque 96pt". _(probed)_                                                                                                                                                                                                                                                                                                                                                | 2026-11-28, maintainer |
| E-09 | The PDFs are PDF/A-2a and PDF/UA-1: tagged, `lang: de-DE`, `--pdf-standard a-2a,ua-1`. _(probed with veraPDF; A3b checks the real PDFs again.)_ Typst's own export checks (title, alt text) guard every build. The PDF date is the document's `effectiveDate`, which makes the bytes reproducible. The author is the business name; Typst writes `Creator: Typst 0.15.1` and nothing else about tooling.                                                                                                                                                                                                      | 2026-11-28, maintainer |
| E-10 | The PDF body is set ragged right with `hyphenate: false`. Typst writes one ToUnicode entry per glyph, so an automatic hyphen can make real hyphens vanish from the extracted text. _(probed)_ Without automatic hyphens, every line-end `-` is a real one.                                                                                                                                                                                                                                                                                                                                                    | 2026-11-28, maintainer |
| E-11 | The app serves each PDF from a static route handler, `app/agb.pdf/route.ts` with `dynamic = "force-static"`. The handler imports the bytes through a Turbopack `bytes` rule for `*.pdf`. _(probed: the prerendered body lands in `.next`, and standalone serves it without the source file. The per-import attribute fails in 16.4.5; the global rule works.)_ The PDFs are not checked in and never copied into `public/`.                                                                                                                                                                                   | 2026-11-28, maintainer |
| E-12 | The provider data (business name, owner, address, e-mail, phone), the site domains and the brand's name and tagline move to `@skillsite/documents/provider`: a plain module with no JSON, no zod and no imports. `content/legal-contact.ts` and the `brand` in `content/site.ts` re-export it. The site, the JSON-LD, the parser and both renderers then read one source, and the navbar pulls no legal tree into the client bundle.                                                                                                                                                                          | 2026-11-28, maintainer |
| E-13 | Repeated phrases (`dpaSentence`, `lawfulBasisContract`) are written out in the Markdown. A legal reader reads the text as it stands, and a macro would hide the wording. Placeholders are only for data that also appears outside the legal texts (E-12) and for the document's own date.                                                                                                                                                                                                                                                                                                                     | 2026-11-28, maintainer |
| E-14 | Labels that both renderers print around legal text ("Rechtsgrundlage:", "Abschnitt N", "Stand", "Kontakt", "Seite x / y") live once in `packages/documents/src/labels.ts` and reach both renderers through the JSON. Web-only chrome ("Auf dieser Seite", the download-link texts) stays in `apps/marketing/src/content/`.                                                                                                                                                                                                                                                                                    | 2026-11-28, maintainer |
| E-15 | The booking keeps recording `agbVersion: "2026-07-14"`. It reads the AGB's `version` from `@skillsite/documents/meta` (generated, versions and dates only, client-safe) instead of `agbEffectiveDate`. Today both hold the same value. A new AGB version updates the literal in the booking test on purpose, in the same PR.                                                                                                                                                                                                                                                                                  | 2026-11-28, maintainer |
| E-16 | `packages/documents/content/**/*.md` goes into `.prettierignore`, because the parser owns that format. Prettier leaves directives alone only with blank lines around every fence, and never with `proseWrap: always`. _(probed)_                                                                                                                                                                                                                                                                                                                                                                              | 2026-11-28, maintainer |
| E-17 | A change under `packages/documents/` runs the full CI suite and the Docker build, Markdown included. Today every area filter excludes `**/*.md`, so a text-only change would get the format check alone. A new filter area `documents: ['packages/documents/**']` has no Markdown exclusion and is ORed into the `full` and `docker` outputs.                                                                                                                                                                                                                                                                 | 2026-11-28, maintainer |
| E-18 | Directive guard: a bare text directive with an unknown name and no `[]` or `{}` stays text, such as `16:00`, `1:2:3` or `Hinweis:Text`. Every other unknown directive fails the build, and so does any wrong use of a registered one. This narrows the brief's "an unknown directive breaks the build" (open question 8).                                                                                                                                                                                                                                                                                     | 2026-11-28, maintainer |

## Rules of the arc

- **The wording does not change.** The tests below prove it per document. An agent that finds a wording change
  necessary asks and changes nothing. A JSX quirk that shows in today's text, such as a space before a link, is
  wording too and is kept.
- **The website does not change**, except for the PDF links (A4). That means the same components, anchor `id`s,
  numbers, navigation, `<head>` and DOM. Two pieces of evidence are required per PR. One is the markup comparison
  below; the PR lists and explains every remaining difference. The other is before/after screenshots under _How
  to check_, delivered as open question 6 decides.
- **Markup comparison** (PR evidence, not a lasting test; the script lands in A1a and A1b, A2 and A4 reuse it):
  - Build `origin/main` and the branch, each with `CAL_API_KEY=`.
  - Take `<head>` and `<body>` from each page's prerendered `.next/server/app/<route>.html`.
  - Remove `<script>` elements and HTML comments, and replace hashed `/_next/static/…` URLs with a placeholder.
  - Merge adjacent text nodes and collapse whitespace, then print one element per line and diff.
- **One source.** After A2, no legal sentence is in TSX, TS data arrays or Typst. The section lists come from the
  Markdown headings.
- **Errors stop the build**, each with the file and line:
  - an unknown node type or placeholder
  - an unknown directive (except E-18)
  - a reference to a missing section
  - a missing or malformed frontmatter field
  - a tree that fails the schema
  - a partial that is missing, included twice or includes itself
  - two documents that include the same partial but differ in `version` or `effectiveDate`
- **Diff-friendly Markdown:** one sentence per line (semantic line breaks) and no hard wrap width. A blank line
  goes around every directive fence, list and heading. A container fence has more colons than every container
  fence nested inside it, and its closing fence repeats the count. Attribute values are always quoted. A literal
  `(*)` is written `(\*)`, because two of them in one line form emphasis.
- **Line ends are not text.** The parser turns every soft line ending, with the spaces around it, into one space.
  No `text` value in the JSON contains a newline (the schema rejects one); only `break` (`\` at a line end) ends
  a line.
- **The wording guards are rights logic** in the sense of `AGENTS.md`. The fixture test, tree-equals-page and
  tree-equals-PDF each get a mutation probe: break it, show the failing test, restore it.
- **PDFs carry no bank data, no IBAN and no tax number**, and address the reader as "Sie". They use only text from
  the tree, the labels (E-14) and the provider and brand data (E-12).
- **A PDF link is an addition.** The PDF is the file that goes out as an e-mail attachment. No text on the site or
  in the PDFs says that a link replaces it.
- **Every PR is `Review: deep`** (families rely on these legal texts). The review session's conclusion goes into
  the PR.

## Target shape

```text
packages/print-kit/                 @skillsite/print-kit - no workspace dependencies, no skillsite strings
  lib.typ                           entry point; README.md documents the API
  src/tokens.typ                    colours (from packages/ui tokens.css, light) + print-only `logo-ink`
  src/page.typ                      page, letterhead head (first / following), footer
  src/blocks.typ                    title block, panel, note box, table, field line, checkbox, place-and-date,
                                    signature line
  fonts/bricolage-grotesque/        static TTFs + OFL.txt
  fonts/hanken-grotesk/             static TTFs + OFL.txt
  assets/logo-icon.png              byte-identical to apps/marketing/public/logo-icon.png (drift test)
  toolchain.json, bin/typst.mjs     Typst pin and runner (E-06)
  examples/specimen.typ             every primitive once, with synthetic text; compiled by the kit's test
  typst.toml, package.json

packages/documents/                 @skillsite/documents
  content/agb.md, datenschutz.md, impressum.md, widerruf.md
  content/partials/widerruf.md      the AGB's withdrawal section body, once in the repo
  src/provider.ts                   export ./provider: provider, domains, brand (E-12)
  src/labels.ts                     shared labels (E-14)
  src/schema/                       frontmatter + node schemas = the registry (E-04)
  src/parse/                        remark pipeline, directive guard, placeholder/ref/partial/date resolution
  src/build.ts                      content -> dist/documents.json (every tree, by slug) + dist/meta.json;
                                    from A4 also dist/<slug>.pdf
  src/pdf.ts                        `pnpm documents:pdf [--out <dir>] [--png]` (A3b)
  src/index.ts                      export ".": getDocument(slug), node types; starts with import "server-only"
  src/meta.ts                       export ./meta: versions and dates from dist/meta.json (E-15)
  typst/document.typ                walker: json(sys.inputs.doc) -> print-kit
  typst/nodes.typ                   one Typst function per node type; the dispatch fails on an unknown type
  turbo.json                        build outputs dist/**; typecheck, lint, test depend on build
  dist/                             generated, gitignored

apps/marketing/src/
  components/docs/document.tsx      React renderer map over the registry, using today's Doc* components
  app/{agb,datenschutz,impressum}/page.tsx      read getDocument(...), render DocShell/DocHero as today
  app/{agb,widerruf,datenschutz}.pdf/route.ts   static PDF responses (A4)
```

A new document is a Markdown file with frontmatter. A `web` target adds a `page.tsx` under `app/<slug>/`, and a
`pdf` target adds `app/<slug>.pdf/route.ts` and an entry in the PDF path constant (A4). Neither needs a parser,
schema or renderer change.

### Frontmatter

The fields are zod-validated. `badge`, `shortTitle`, `lead` and `description` are required for `web` targets
only (open question 4).

| Field           | Meaning                                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`         | the h1 and the PDF title. It may hold U+00AD (today's `Geschäfts&shy;bedingungen`). The Typst walker drops U+00AD when it sets the title.                                                                                                               |
| `shortTitle`    | the `<title>` segment ("AGB", "Datenschutz", "Impressum")                                                                                                                                                                                               |
| `badge`         | the hero pill, and the PDF's eyebrow                                                                                                                                                                                                                    |
| `lead`          | the hero lead, and the PDF's subtitle                                                                                                                                                                                                                   |
| `description`   | the meta description                                                                                                                                                                                                                                    |
| `version`       | the identifier the booking records (E-15)                                                                                                                                                                                                               |
| `effectiveDate` | an ISO date. The parser adds `effectiveDateLabel`, formatted once with `Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" })` ("Juli 2026"). Hero, PDF "Stand:" and `:value[document.effectiveDate]` print only the label. |
| `targets`       | `[web, pdf]` for AGB and privacy policy, `[web]` for the Impressum, `[pdf]` for the withdrawal notice                                                                                                                                                   |
| `sections`      | `{ numbered, nav }`: AGB and privacy policy are numbered and have navigation; the Impressum has neither                                                                                                                                                 |

Today's values: AGB and privacy policy both have `version` and `effectiveDate` `2026-07-14` (`agb.ts:4`,
`privacy.ts:4`). The withdrawal notice has the AGB's values, enforced by the partial rule. Its title is
"Widerrufsbelehrung und Muster-Widerrufsformular".

### Node types and their source

The labels are the JSX components they replace. On the web every type renders through today's component, with
the same classes.

| Type                       | Source                                                                              | Web (today's)                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `section`                  | `## Title :anchor{#id nav="Label"}`; `nav` defaults to the title                    | `DocSection`, number from `sections.numbered`, navigation entry                                                                         |
| `subsection`               | `::::subsection[Title]` … `::::`                                                    | `DocSubSection`                                                                                                                         |
| `group`                    | `:::::group[Title]` … `:::::`                                                       | `DocGroup`                                                                                                                              |
| `paragraph`                | a paragraph; entirely `**…**` gives `weight: medium`, other emphasis fails          | `ProseP`, `font-medium` for `medium`. Right after a `contactAddress`, the renderer adds `mt-6` as today; the source carries no spacing. |
| `list`                     | a Markdown bullet list                                                              | `DocList`                                                                                                                               |
| `legalBasis`               | `:::legal-basis` … `:::` (the label comes from E-14)                                | `DocLegalBasis`                                                                                                                         |
| `providerLink`             | `::provider-link[Datenschutzerklärung von Cal.com]{href="https://cal.com/privacy"}` | `DocProviderLink`                                                                                                                       |
| `linkList`                 | `:::link-list` around `- [Discord](https://…)`; each item exactly one link          | `DocLinkList`                                                                                                                           |
| `detailGrid`, `detailList` | `::::detail-grid` around `:::detail-list[Title]` with a bullet list                 | `DocDetailGrid`, `DocDetailList`                                                                                                        |
| `entry`                    | `:::entry` … `:::` (today's hosting-provider block)                                 | the `not-first:mt-5` wrapper                                                                                                            |
| `contactAddress`           | `::contact-address` (lines from E-12)                                               | `Address` with `<br>`, as `ContactAddress`                                                                                              |
| `panel`                    | `:::::panel` … `:::::`                                                              | its children with no wrapper (the box is PDF-only)                                                                                      |
| `form`                     | `:::form` with children in source order                                             | `DocIndentBlock`                                                                                                                        |
| ↳ `formLine`               | `::form-line[Text]`: a line with nothing to fill in                                 | one of `lines`                                                                                                                          |
| ↳ `field`                  | `::field[Label]`                                                                    | one of `lines`                                                                                                                          |
| ↳ `signature`              | `::signature[Label]`                                                                | one of `lines`                                                                                                                          |
| ↳ `formNote`               | `::form-note[Text]`, at most one, last                                              | `footnote`                                                                                                                              |

**Inline nodes:**

- **`text`**.
- **`break`**: a backslash at the end of a line.
- **`link`**: has a `kind` set by the parser.
  - `route`: `[Preisübersicht](/preise)`. The PDF makes it absolute from the site domain.
  - `anchor`: `:ref[id]` becomes the link "Abschnitt N" to `#id`. The PDF links to the section's label.
  - `mailto`: `:mailto[provider.email]`.
  - `tel`: `:tel[provider.phone]`.
  - `external`: a Markdown `https:` link.

`:value[key]` (text from E-12 or `document.effectiveDate`) and `::include{src="widerruf"}` (resolved against
`content/partials/<src>.md`) exist only in the source. The parser resolves both before it writes the JSON.

The withdrawal form maps line by line. The order stays as today, with "Datum" after the signature:

1. `::form-line[An :value[provider.businessName], :value[provider.street], :value[provider.city], E-Mail: :value[provider.email]:]`. The address is plain text today, not a link.
2. `::field[Hiermit widerrufe(n) ich/wir (\*) den von mir/uns (\*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: …]`
3. `::field[Bestellt am (\*)/erhalten am (\*)]`
4. `::field[Name des/der Verbraucher(s)]`
5. `::field[Anschrift des/der Verbraucher(s)]`
6. `::signature[Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)]`
7. `::field[Datum]`
8. `::form-note[(\*) Unzutreffendes streichen.]`

The form does not use the kit's place-and-date primitive, because the line reads "Datum" only.

### Print design

This table is the public record of the brand's document design. A3a builds it; the maintainer accepted it on
2026-11-28.

| Element                       | Value                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page                          | A4 portrait, margins 30 mm (top, header included) / 20 mm (sides) / 22 mm (bottom), white, no shadows, fonts embedded                                                                                                                                                                                                                                   |
| Page 1 head                   | Full-bleed bar 7 mm in `logo-ink` `#010e1e` (the darkest tone of the logo tile), with a 0.9 mm line below it (gradient `coral` → `coral-2`). The large lockup sits 20 mm from the left and 17.5 mm from the top: tile 12 mm (radius 3 mm, alt text = brand name), gap 3.2 mm, name Bricolage 700 12.5 pt `ink`, tagline Hanken 8 pt `ink-soft` +0.03em. |
| Following pages               | No bar (open question 9). Small lockup: tile 10 mm (the logo's print minimum), name 9.5 pt, tagline 7 pt `ink-soft`; the document title on the right in 8.5 pt `ink-soft`; a hairline in `line` 3.5 mm below                                                                                                                                            |
| Footer                        | 8.5 pt `ink-soft`, on every page: left "<brand name> · <domain>", right "Seite x / y"                                                                                                                                                                                                                                                                   |
| Title block                   | Eyebrow (`badge`) 8 pt 700 caps +0.12em `ink-soft`; title Bricolage 800 30 pt, line height 1.04, −0.025em, `ink`; accent stroke 24 × 1.4 mm, radius 1 mm, gradient `coral` → `coral-2`; lead 12.5 pt / 1.5 `ink-soft`; "Stand: <label>" 10 pt `ink-soft`                                                                                                |
| Headings                      | h2 Bricolage 700 14 pt, −0.01em, 9 mm above, 3 mm below, sticky to the next block; h3 Bricolage 700 12 pt; group title like the eyebrow                                                                                                                                                                                                                 |
| Body                          | Hanken 400 11 pt / 1.6 `ink`, paragraph gap 3 mm, ragged right, no hyphenation (E-10); `medium` paragraphs 500                                                                                                                                                                                                                                          |
| Lists                         | round bullet 1.5 mm in `ink-soft`, indent 5 mm, 1.6 mm between items                                                                                                                                                                                                                                                                                    |
| Links                         | `ink`, underlined; coral is never a text colour                                                                                                                                                                                                                                                                                                         |
| Note box                      | `legalBasis`, `detailList`: fill `surface-2`, radius 3.7 mm, padding 3.4 / 5 mm, 10 pt, label bold, unbreakable                                                                                                                                                                                                                                         |
| Panel                         | border 0.75 pt `line`, radius 3.7 mm, padding 5 mm, unbreakable (open question 3)                                                                                                                                                                                                                                                                       |
| Form                          | the form is unbreakable; `field`: label, then a line in `line`, 9 mm line pitch; `signature`: a 70 mm line with the label below; `formNote` 8.5 pt `ink-soft`                                                                                                                                                                                           |
| Table (kit only, unused here) | header bar `surface-2` with 2.5 mm top radius, 8.2 pt caps 700 +0.1em, a 2 px `navy` rule below; rows with 1 px `line` separators, no vertical rules, padding 3 mm, first column bold                                                                                                                                                                   |
| Coral                         | only in the page-1 line and the accent stroke                                                                                                                                                                                                                                                                                                           |

## Requirements

### Phase A - Documents

**A0 - This spec.** _(now; docs only)_

- _Check:_ none visible.
- _Acceptance criteria:_
  - [x] The maintainer accepted the decisions and answered the open questions. The status line says so.

**A1a - Package, parser and registry.** _(after A0)_

- _Technique:_
  - **First commit:** a component test renders today's `/agb` from the untouched JSX and stores the
    normalised visible text of `<main>` as a fixture. The fixture covers the hero, the navigation and the
    article. Normalisation: a block boundary becomes one space, an inline boundary adds nothing, whitespace is
    collapsed.
  - **The package.** Scaffold `@skillsite/documents`:
    - `package.json` with the exports `.`, `./provider` and `./meta`
    - tsconfig and ESLint from `packages/config`
    - Vitest `src/**/*.test.ts`
    - `packages/documents/turbo.json`
    - `^build` before `test` and `dev` in the root `turbo.json`
    - the app's workspace dependency on the package, and the package in `transpilePackages`: `content/site.ts` and
      `content/legal-contact.ts` read `./provider` from here on
  - **Parser and build.** The schemas, then the remark pipeline with the directive guard (E-18) and
    placeholder, `:ref`, partial and date resolution, then `build.ts`.
  - **Shared data.** Add `provider.ts` with the re-exports in `legal-contact.ts`, `site.ts` and `privacy.ts`
    (E-12), and `labels.ts`.
  - **CI.** The filter area (E-17), with `Area`, the pinned output expressions and the new mapping cases in
    `tests/ci-workflow.test.mts`.
  - **Docs.** `AGENTS.md` gets the new package under _Where to look_ and the Vitest glob. `docs/testing.md` gets
    the documents tests on the logic layer.
  - `/agb` is unchanged; all parser tests use synthetic Markdown.
- _Check:_ none visible. `/agb` still renders from JSX.
- _Acceptance criteria:_
  - [ ] The fixture test is green on the first commit.
  - [ ] Every build error under _Rules_ has a test with a synthetic document.
  - [ ] `16:00 Uhr`, `1:2:3` and `Hinweis:Text` stay text, while `::contact-adress`, `:::panle` and `:mailtoo[x]`
        fail with file and line.
  - [ ] A two-line paragraph gives one `text` node joined by a single space. `a\` + newline + `b` gives text,
        break, text.
  - [ ] `effectiveDateLabel` of a synthetic `2026-07-14` is "Juli 2026".
  - [ ] Every directive form in _Node types_ parses in a synthetic document.
  - [ ] `just build` passes, with the navbar importing `brand` from `./provider`. A client import of the root
        entry fails the build through `server-only`.

**A1b - The AGB from Markdown.** _(after A1a)_

- _Technique:_
  - Add the React renderer `components/docs/document.tsx` for the node types the AGB needs.
  - Write `agb.md` and `partials/widerruf.md`, and add the `.prettierignore` entry (E-16).
  - `app/agb/page.tsx` reads `getDocument("agb")`.
  - `modules/booking/model/mapping.ts` reads `version` from `./meta` (E-15). `mapping.test.ts` asserts the literal
    `"2026-07-14"` instead of today's date shape.
  - Delete `content/legal/agb.tsx` and `content/agb.ts`.
  - `AGENTS.md`: legal text lives in `packages/documents/content/`, with labels and provider data in `src/`; add
    the Markdown rules and the directive trap.
- _Check:_ `/agb` against the live page, in light and dark, on phone and desktop:
  - the hero and its date
  - the nine numbered sections, the navigation and its scrollspy
  - the withdrawal section with its form
  - the link to `/preise` and the `mailto:` links
- _Acceptance criteria:_
  - [ ] The fixture test is green on the last commit (Markdown).
  - [ ] A lasting test asserts that the text of `/agb`'s `<article>` equals the text of the AGB tree.
  - [ ] `renderers` covers every registered type, enforced by the type check and by a test.
  - [ ] The form's first line contains no `<a>`.
  - [ ] Mutation probes, each failing and then restored:
    - one character changed in `agb.md` fails the fixture test
    - a space between two words deleted fails the fixture test
    - a renderer that drops one link's text fails tree-equals-article
    - another `version` in `agb.md` fails `mapping.test.ts`
  - [ ] The markup comparison of `/agb` shows no difference, or the PR explains each one.
  - [ ] Before/after screenshots per open question 6.
  - [ ] No legal sentence of the AGB is left in `apps/marketing/src`.

**A2 - Privacy policy and Impressum.** _(after A1b)_

- _Technique:_
  - **Renderers:** the remaining node types: `group`, `entry`, `detailGrid`/`detailList`, `linkList`,
    `contactAddress`, `legalBasis`, `providerLink` and the `mt-6` rule.
  - **Fixtures first**, as in A1a, for `/datenschutz` and `/impressum`.
  - **Content:** write `datenschutz.md` and `impressum.md`. The date in "hat den Stand …" is
    `:value[document.effectiveDate]`.
  - **Deletions:**
    - `content/legal/`
    - `content/privacy.ts`
    - `lib/numbered-sections.ts` with its test
    - `ContactAddress`, once nothing uses it
  - **Docs:** amend foundation V7 and its "Where things go" sentence. `AGENTS.md` drops `content/legal/*.tsx`.
- _Check:_ `/datenschutz` and `/impressum` against the live pages, every section, in light and dark, on phone and
  desktop:
  - the provider blocks and the two detail cards
  - the link list and the legal-basis boxes
  - the authority's address
  - the section references ("siehe Abschnitt 8") and their jumps
- _Acceptance criteria:_
  - [ ] Fixture tests and the lasting tree-equals-article tests pass for both pages.
  - [ ] Renderer test: a `paragraph` after a `contactAddress` gets `mt-6`, any other paragraph does not.
  - [ ] Mutation probes, each failing and then restored:
    - one character changed in `datenschutz.md`
    - a `legalBasis` renderer that drops its children
  - [ ] The markup comparison shows no difference, or the PR explains each one. Before/after screenshots.
  - [ ] `apps/marketing/src/content/legal/` no longer exists, and `grep` finds none of the moved sentences in
        `apps/marketing/src`.

**A3a - Print kit.** _(after A2)_

- _Technique:_
  - `packages/print-kit/` per _Target shape_ and _Print design_.
  - `lib.typ` takes the brand name, tagline, logo alt text, domain, document title, date label and labels as
    arguments, so the kit holds no brand or business strings.
  - The runner (E-06).
  - The kit's `test` script is a dependency-free `node --test` file: it compiles `specimen.typ` through the
    runner.
  - Drift tests in `tests/`: every `tokens.typ` colour except `logo-ink` equals its light value in `tokens.css`,
    and the logo bytes equal `public/logo-icon.png`.
  - `AGENTS.md`: the kit under _Where to look_.
- _Check:_ the PNG of every specimen page, against _Print design_:
  - the bar and the coral line
  - both lockups and the footer
  - the margins
  - the panel, note box, table and form primitives
- _Acceptance criteria:_
  - [ ] `specimen.typ` compiles with `--root packages/print-kit --font-path packages/print-kit/fonts --ignore-system-fonts`.
  - [ ] `package.json` has no `@skillsite/*` and no `workspace:` entry in any dependency field (a test).
  - [ ] The runner rejects a wrong SHA-256 (mutation probe) and ignores a Typst on the `PATH`.
  - [ ] The drift tests pass.

**A3b - Document PDFs.** _(after A3a)_

- _Technique:_
  - **Walker:** `typst/document.typ` and `nodes.typ` (E-07). Sections carry labels for `anchor` links, and
    `route` links become absolute.
  - **Frontmatter:** the target-dependent fields (open question 4).
  - **New content:** `widerruf.md`, which includes the partial, and the `:::::panel` in the partial (open question
    3).
  - **Command:** `pnpm documents:pdf [--out <dir>] [--png]`.
  - **Docs:** `AGENTS.md` lists `pnpm documents:pdf` under _Commands_.
- _Check:_ the three PDFs and the PNG of every page:
  - the breaks, with no widows or orphans
  - no split box or form, and no heading alone at a page end
  - head and foot on every page
  - clickable links and embedded fonts
- _Acceptance criteria:_
  - [ ] A lasting test per PDF compares its extracted text (`unpdf`, page chrome removed) with the tree's text.
        Both sides get the same normalisation: U+00AD is dropped, `-` followed by whitespace becomes `-`, and every
        other whitespace run becomes one space.
  - [ ] A two-sentence paragraph comes out as one line in the extracted text (no line end between the
        sentences).
  - [ ] Every link annotation is `https:`, `mailto:` or `tel:` (no relative `/URI`), or an internal destination.
  - [ ] A fixture holds one node of every registered type and one link of every kind, and it compiles. A fixture
        with an unknown type fails.
  - [ ] Two builds give byte-identical PDFs. The metadata names the business as author and nothing about AI. The
        PDF text contains "Stand: Juli 2026".
  - [ ] veraPDF (the pinned `verapdf/cli` image, run locally) passes PDF/A-2a and PDF/UA-1 for all three PDFs. The
        summary goes into _How it was checked_.
  - [ ] Mutation probes, each failing tree-equals-PDF and then restored:
    - a node function that drops its text
    - a real space removed next to a line-end hyphen
  - [ ] PNG previews of every page per open question 6. The PDFs are not committed.

**A4 - Build and delivery.** _(after A3b)_

- _Technique:_
  - **Build:** the documents `build` also writes the PDFs, so every `next build` and every image has them.
  - **Docker:** the build stage installs `xz-utils` and runs the same runner (E-06), with the tarball in a cache
    mount.
  - **Routes:** add the route handlers (E-11) with `Content-Type: application/pdf` and the same cache policy as
    the legal pages. A deploy never serves a stale PDF.
  - **Links:** `SmartLink` renders file URLs (`/x.pdf`) as a plain `<a>` with `download` instead of prefetching
    them through `next/link`, covered by a unit test. Add the links (open question 5).
  - **Paths:** the PDF paths get their own constant, not `routes`, so they stay out of the sitemap and the page
    smoke loop.
  - **Fixtures:** the first commit updates the `/agb` and `/datenschutz` fixtures with the link texts.
- _Check:_
  - `/agb` and `/datenschutz` with the new links, in light and dark, on phone and desktop.
  - Each PDF opened and downloaded from the `just smoke` server and from `just docker-run`, without submitting
    anything.
- _Acceptance criteria:_
  - [ ] A smoke test: each PDF answers 200 with `application/pdf`.
  - [ ] The fixture diff adds exactly the link texts and nothing else.
  - [ ] `just check` and the CI Docker build pass, and the image serves all three PDFs.
  - [ ] No PDF is in git, `public/` is unchanged, and the runner-stage `COPY` whitelist test is unchanged.
  - [ ] The markup comparison shows only the links. Before/after screenshots.

## Timeline / phasing

```text
A0 -> A1a -> A1b -> A2 -> A3a -> A3b -> A4     one gh stack on top of A0
```

The slices run strictly in sequence; each builds on the previous tree and renderer. Shared files:

- `packages/documents/src/schema/`, `components/docs/document.tsx` (A1a-A3b)
- `AGENTS.md` (A1a, A1b, A2, A3a, A3b), `docs/testing.md` (A1a)
- root `turbo.json`, `package.json` (A1a, A3b, A4)
- `ci.yml`, `tests/ci-workflow.test.mts` (A1a)
- `tests/` drift tests (A3a)
- `Dockerfile` (A4)

## Open questions

### For the maintainer

None open. The maintainer accepted each proposal below on 2026-11-28; question 2 with a change, recorded there.
The numbers stay, because the slices cite them.

1. **How long the wording fixtures live.** `docs/testing.md` rule 4 removes "nothing changed" checks when their
   PR merges.
   - _Proposal:_ the fixture tests stay until the follow-up text PR, which deletes them. The tree-equals-page and
     tree-equals-PDF tests stay for good.
   - _Reason:_ until then they guard the open stack against every rebase.
2. **Open PRs on the legal texts.** #281 and #285 touch `datenschutz.tsx`, #286 and #287 touch `agb.tsx`, and
   #289 already builds PDFs. #290 touches no legal file.
   - _Decided:_ the open PRs stay as they are; none is closed or rebased by this arc, and the arc does not wait
     for them. Their legal changes come later, as Markdown.
   - _Consequence:_ should one of them merge first, the fixture is captured from the `origin/main` of that day
     (E-01).
3. **The panel.**
   - _Proposal:_ it holds "Widerrufsbelehrung", "Folgen des Widerrufs" and "Erlöschen des Widerrufsrechts", the
     statutory notice. The model form follows outside it. The panel is drawn as a `line` border; the note boxes
     use the `surface-2` fill. The AGB PDF shows the same panel, because the partial is one source.
   - _Reason:_ the border sets the long statutory part apart from the shorter note boxes and uses no toner across
     a full page.
4. **The withdrawal PDF has no text for a subtitle or eyebrow.** The brief requires `lead` and `description` for
   every document, and the withdrawal notice has no such text today.
   - _Proposal:_ the withdrawal PDF shows only the title and "Stand". The schema requires `badge`, `shortTitle`,
     `lead` and `description` only for `web` targets.
   - _Reason:_ every new text needs your OK. The alternative is that you supply both lines.
5. **The PDF links** (visible, new text).
   - _Proposal:_ a row below the hero facts with `Button variant="outline" size="sm"` and a download icon. On
     `/agb` the buttons read "Als PDF herunterladen" and "Widerrufsbelehrung als PDF"; on `/datenschutz`,
     "Als PDF herunterladen".
   - _Reason:_ the row reuses an existing variant and keeps the facts grid untouched. The two `/agb` labels say
     which file each link opens.
6. **Images in the PR.** `gh` cannot upload images. This covers the PDF page PNGs (A3a, A3b) and the before/after
   screenshots (A1b, A2, A4) at 390 and 1280 px, light and dark.
   - _Proposal:_ one commit adds them under `packages/documents/preview/`, the PR body links them by commit SHA,
     and the next commit removes them, so the squash commit on `main` holds none.
   - _Reason:_ you see them in the PR without a checkout.
   - _Alternative:_ local paths only, as in #284.
7. **A download during the build.** The build, CI and Docker download the Typst release from `github.com`,
   checked by SHA-256.
   - _Proposal:_ accept it.
   - _Reason:_ no new service, the same host as the source code, and the image build already downloads Google
     Fonts.
8. **Directive guard (E-18).** It narrows your rule that an unknown directive breaks the build.
   - _Proposal:_ a bare `:name` with no `[]` or `{}` stays text.
   - _Reason:_ German prose such as `16:00`, `1:2:3` and `Hinweis:Text` stays readable without escapes.
   - _Alternative:_ every unknown directive fails, and the sources escape the colon as `16\:00`.
9. **Bar on following pages.** The invoice letterhead repeats the bar on every page, and your brief names it for
   page 1.
   - _Proposal:_ page 1 only. Following pages get the small lockup and a hairline.
   - _Reason:_ "calm, not colourful" is the document rule, and a long document gets no dark band on every page.

## Rules for implementing agents

[`AGENTS.md`](../../AGENTS.md) applies in full. Every PR of this arc is `Review: deep`.

- **Legal text.**
  - Never edit a legal sentence. A text that seems wrong is reported, not fixed.
  - Bulk edits over German files use only UTF-8-safe tools.
- **Sources.**
  - The text basis is `origin/main` at the time the fixture is captured.
  - Never copy text from an open PR.
  - Never open or read a contract draft or any other draft outside the repository, not even for comparison.
- **Repository.** No reference to private notes or local paths. _Print design_ is the public record.
- **Dependencies.** No new runtime dependency is planned.
  - `zod` and `server-only` are already the app's.
  - The parser stack (`unified`, `remark-*`, `mdast-util-directive`, `unist-util-visit`), `yaml` and `unpdf` are
    dev dependencies of `@skillsite/documents`, used at build and test time only.
  - Each is named with its reason in the PR that adds it.
- **PDF review.** Look at every page's PNG yourself before the PR goes out.
