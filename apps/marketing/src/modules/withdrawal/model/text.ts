/**
 * Cleaning of the visitor's text before it reaches an e-mail. The e-mails are
 * plain text; a single-line value can end up in a subject, so it keeps no line
 * break. Both forms drop control characters and the invisible bidirectional
 * overrides that could make a text read differently from what it says.
 */

/** C0 and C1 control characters, DEL, line and paragraph separators. */
const CONTROL = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g;
/** C0 and C1 control characters except the line feed. */
const CONTROL_EXCEPT_LF =
  /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029]/g;
/** Bidirectional embeddings, overrides and isolates. */
const BIDI = /[\u202A-\u202E\u2066-\u2069]/g;

/** One line: every control character becomes a space, runs of spaces one. */
export function singleLine(value: string): string {
  return value
    .replace(BIDI, "")
    .replace(CONTROL, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

/**
 * Several lines: CR LF and CR become LF, tabs a space, other control
 * characters go; at most one blank line in a row.
 */
export function multiLine(value: string): string {
  return value
    .replace(BIDI, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, " ")
    .replace(CONTROL_EXCEPT_LF, "")
    .replace(/[ ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
