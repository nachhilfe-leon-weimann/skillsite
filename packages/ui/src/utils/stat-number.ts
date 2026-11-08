/**
 * The number inside a stat value such as "320+", "4,8" or "1.200+", read the
 * German way: a comma marks the decimals, a dot groups the thousands.
 */
export type StatNumber = {
  /** Text before the number, e.g. "€ ". */
  prefix: string;
  /** Text after the number, e.g. "+". */
  suffix: string;
  /** The number itself: 1200 for "1.200". */
  to: number;
  /** Digits after the decimal comma. */
  decimals: number;
  /** Whether the value groups its thousands with a dot. */
  grouped: boolean;
};

/**
 * Text, then a German number, then text. The integer part is "0", plain digits
 * without a leading zero, or dot-separated groups of three; an optional comma
 * part holds the decimals. Anything else (such as "24/7" or "1.5") is no number.
 */
const STAT = /^(\D*)(0|[1-9]\d{0,2}(?:\.\d{3})+|[1-9]\d*)(?:,(\d+))?(\D*)$/;

/** Splits a stat value around its number; `null` when it holds none to count. */
export function parseStatNumber(value: string): StatNumber | null {
  const match = STAT.exec(value);
  if (!match) return null;
  const [, prefix = "", integer = "", fraction = "", suffix = ""] = match;
  return {
    prefix,
    suffix,
    to: Number(`${integer.replaceAll(".", "")}.${fraction || "0"}`),
    decimals: fraction.length,
    grouped: integer.includes("."),
  };
}

/**
 * Writes a number the way its stat value writes its own: the same decimals
 * after a comma, and thousands grouped with a dot when the value groups them.
 * Formatting the stat's own number gives back its original text.
 */
export function formatStatNumber(
  value: number,
  { decimals, grouped }: Pick<StatNumber, "decimals" | "grouped">,
): string {
  const [integer = "", fraction] = value.toFixed(decimals).split(".");
  const digits = grouped
    ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : integer;
  return fraction === undefined ? digits : `${digits},${fraction}`;
}
