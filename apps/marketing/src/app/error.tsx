"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Container } from "@skillsite/ui/layout/container";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Button } from "@skillsite/ui/primitives/button";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
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
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-section text-center">
      <Eyebrow>Ein Fehler ist aufgetreten</Eyebrow>
      <Heading as="h1" size="h1" className="mt-4">
        Da ist etwas schiefgelaufen.
      </Heading>
      <Text size="lead" tone="muted" className="mt-4 max-w-measure-34">
        Bitte versuch es noch einmal. Wenn es weiterhin klemmt, schreib mir
        einfach direkt – wir kriegen das hin.
      </Text>
      <div className="mt-8 flex flex-wrap justify-center gap-3.5">
        <Button variant="primary" size="lg" onClick={reset}>
          Nochmal versuchen
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={routes.contact}>Kontakt aufnehmen</Link>
        </Button>
      </div>
    </Container>
  );
}
