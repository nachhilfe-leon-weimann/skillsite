"use client";

// The fonts come first, as in layout.tsx: their @font-face rules stay ahead of globals.css.
import { fontVariables } from "@skillsite/ui/shell/fonts";

import "./globals.css";
import { useEffect } from "react";

import { ThemeProvider } from "@skillsite/ui/shell/theme-provider";
import {
  siteViewport,
  siteViewportContent,
  templatedTitle,
} from "@/lib/metadata";
import { errorPage } from "@/content/status";

import { ErrorState } from "./_components/error-state";

/**
 * Root error boundary. It replaces the root layout when the layout itself fails,
 * so it renders its own document - the brand fonts, the global styles, the
 * stored theme and the layout's viewport - and leaves out navbar and footer,
 * which belong to the layout.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
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
        {/* React hoists these into <head>; the layout's metadata is gone with it. */}
        <title>{templatedTitle(errorPage.eyebrow)}</title>
        <meta name="viewport" content={siteViewportContent} />
        {siteViewport.themeColor.map(({ media, color }) => (
          <meta key={media} name="theme-color" media={media} content={color} />
        ))}
        <ThemeProvider>
          <main id="main" className="flex-1">
            <ErrorState onRetry={retry} />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
