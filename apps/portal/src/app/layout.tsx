import type { Metadata } from "next";
import Link from "next/link";

// The fonts come first: their @font-face rules stay ahead of globals.css in the built CSS.
import { fontVariables } from "@skillsite/ui/shell/fonts";

import "./globals.css";
import { Container } from "@skillsite/ui/layout/container";
import { Logo } from "@skillsite/ui/shell/logo";
import { ThemeProvider } from "@skillsite/ui/shell/theme-provider";
import { brand, siteMetadata } from "@/content/site";
import { routes } from "@/lib/routes";

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        {/* Light only until the student portal (AH-10): no toggle, and the system preference is ignored. */}
        <ThemeProvider forcedTheme="light">
          <header className="border-b border-line">
            <Container className="flex items-center py-3">
              <Link href={routes.home} className="shrink-0">
                <Logo
                  name={brand.name}
                  tagline={brand.tagline}
                  src={brand.logo}
                />
              </Link>
            </Container>
          </header>
          <main id="main" className="flex-1">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
