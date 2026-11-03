import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

import "./globals.css";
import { cn } from "@skillsite/ui/utils";
import { SITE_URL } from "@/lib/routes";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Online-Nachhilfe für Mathe, Informatik und Physik",
    template: "%s – Nachhilfe Leon Weimann",
  },
  description:
    "Persönliche Online-Nachhilfe in Mathematik, Informatik und Physik – flexibel, ohne Mindestlaufzeit und für 30 € pro 60 Minuten.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Nachhilfe Leon Weimann",
    title: "Online-Nachhilfe für Mathe, Informatik und Physik",
    description:
      "Persönliche Online-Nachhilfe – flexibel, ohne Mindestlaufzeit und für 30 € pro 60 Minuten.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online-Nachhilfe für Mathe, Informatik und Physik",
    description:
      "Persönliche Online-Nachhilfe – flexibel, ohne Mindestlaufzeit und für 30 € pro 60 Minuten.",
  },
  verification: {
    other: {
      "facebook-domain-verification": "mgl8asl7f0d24t8p3g6kb2x9bw9or0",
    },
  },
};

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
