/**
 * Brand colours for runtimes that cannot read CSS variables: the theme-color
 * meta tags, the web app manifest and the QR code. Each mirrors a raw token of
 * `styles/tokens.css`; `colors.test.ts` keeps them equal.
 */
export const brandColors = {
  /** `--bg`, light */
  bg: "#faf6f0",
  /** `--bg`, dark */
  bgDark: "#0c1825",
  /** `--surface`, light */
  surface: "#ffffff",
  /** `--ink`, light */
  ink: "#16293d",
  /** `--ink-soft`, light */
  inkSoft: "#55677a",
  /** `--navy`, light */
  navy: "#13283f",
  /** `--coral` */
  coral: "#ff6a45",
} as const;
