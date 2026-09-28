"use client";

import Link from "next/link";
import { useEffect } from "react";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { routes } from "@/lib/routes";

/**
 * Route-level error boundary. Mirrors not-found.tsx so an uncaught render error
 * (e.g. in the client-side Booker) degrades to a calm, on-brand page with a
 * retry instead of Next's bare default.
 */
export default function Error({
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
    <StatusPage
      eyebrow="Ein Fehler ist aufgetreten"
      title="Da ist etwas schiefgelaufen."
      lead={
        <>
          Bitte versuch es noch einmal. Wenn es weiterhin klemmt, schreib mir
          einfach direkt – wir kriegen das hin.
        </>
      }
      actions={
        <>
          <Button variant="primary" size="lg" onClick={reset}>
            Nochmal versuchen
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={routes.contact}>Kontakt aufnehmen</Link>
          </Button>
        </>
      }
    />
  );
}
