import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { LinkButton } from "@skillsite/ui/primitives/button";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Seite nicht gefunden",
  unlisted: true,
});

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-section text-center">
      <Eyebrow>Fehler 404</Eyebrow>
      <Heading as="h1" size="h1" className="mt-4">
        Seite nicht gefunden.
      </Heading>
      <Text size="lead" tone="muted" className="mt-4 max-w-[34em]">
        Diese Seite gibt es nicht. Vielleicht hilft dir eine dieser Optionen
        weiter.
      </Text>
      <div className="mt-8 flex flex-wrap justify-center gap-3.5">
        <LinkButton href={routes.home} variant="primary" size="lg">
          Zur Startseite
        </LinkButton>
        <LinkButton href={routes.contact} variant="outline" size="lg">
          Kontakt aufnehmen
        </LinkButton>
      </div>
    </Container>
  );
}
