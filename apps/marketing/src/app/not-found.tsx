import Link from "next/link";
import type { Metadata } from "next";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Seite nicht gefunden",
  unlisted: true,
});

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="Fehler 404"
      title="Seite nicht gefunden."
      lead={
        <>
          Diese Seite gibt es nicht. Vielleicht hilft dir eine dieser Optionen
          weiter.
        </>
      }
      actions={
        <>
          <Button asChild variant="primary" size="lg">
            <Link href={routes.home}>Zur Startseite</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={routes.contact}>Kontakt aufnehmen</Link>
          </Button>
        </>
      }
    />
  );
}
