"use client";

// The fonts come first, as in layout.tsx: their @font-face rules stay ahead of globals.css.
import { fontVariables } from "@skillsite/ui/shell/fonts";

import "./globals.css";
import { useEffect } from "react";

import { ThemeProvider } from "@skillsite/ui/shell/theme-provider";
import { templatedTitle } from "@/lib/metadata";

import { ErrorState, errorEyebrow } from "./_components/error-state";

/**
 * Root error boundary. It replaces the root layout when the layout itself fails,
 * so it renders its own document - the brand fonts, the global styles and the
 * stored theme - and leaves out navbar and footer, which belong to the layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang="de"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={fontVariables}
    >
      <body className="flex min-h-dvh flex-col">
        <title>{templatedTitle(errorEyebrow)}</title>
        <ThemeProvider>
          <main id="main" className="flex-1">
            <ErrorState onRetry={reset} />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
