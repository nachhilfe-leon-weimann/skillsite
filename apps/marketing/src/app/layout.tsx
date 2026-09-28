import type { Metadata, Viewport } from "next";

// The fonts come first: their @font-face rules stay ahead of globals.css in the built CSS.
import { fontVariables } from "@skillsite/ui/shell/fonts";

import "./globals.css";
import { brandColors } from "@skillsite/ui/tokens/colors";
import { siteMetadata } from "@/lib/metadata";
import { ThemeProvider } from "@skillsite/ui/shell/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { IosToolbarTint } from "@/components/layout/ios-toolbar-tint";
import { UmamiAnalytics } from "@/components/analytics/umami";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brandColors.bg },
    { media: "(prefers-color-scheme: dark)", color: brandColors.bgDark },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={fontVariables}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-overlay focus:rounded-full focus:bg-navy focus:px-5 focus:py-2.5 focus:text-skip-link focus:font-semibold focus:text-white focus:shadow-card"
        >
          Zum Inhalt springen
        </a>
        <ThemeProvider>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
        {/* iOS 26 Safari samples this pinned strip's colour to tint the area
            around the floating bottom toolbar; only active at the footer
            (see globals.css + IosToolbarTint). */}
        <IosToolbarTint />
        <UmamiAnalytics />
        <JsonLd />
      </body>
    </html>
  );
}
