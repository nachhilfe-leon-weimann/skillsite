import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

import "./globals.css";
import { cn } from "@skillsite/ui/utils/cn";
import { siteMetadata } from "@/lib/metadata";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { IosToolbarTint } from "@/components/layout/ios-toolbar-tint";
import { UmamiAnalytics } from "@/components/analytics/umami";
import { JsonLd } from "@/components/seo/json-ld";

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

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1825" },
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
      className={cn(bricolage.variable, hanken.variable)}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-navy focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-card"
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
