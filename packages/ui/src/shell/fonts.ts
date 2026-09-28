import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

/*
 * The brand fonts. next/font/google downloads them at build time and emits the
 * @font-face rules. The classes set the variables the theme reads
 * (`--font-bricolage`, `--font-hanken`; styles/tokens.css): put `fontVariables`
 * on <html>. An app imports this module before its global stylesheet, so the
 * @font-face rules keep their place at the top of the built CSS.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

/** Class names that define the font variables, for <html>. */
export const fontVariables = `${bricolage.variable} ${hanken.variable}`;
