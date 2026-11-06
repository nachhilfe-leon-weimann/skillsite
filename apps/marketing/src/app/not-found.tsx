import Link from "next/link";
import type { Metadata } from "next";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { notFoundPage } from "@/content/status";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  ...notFoundPage.metadata,
  unlisted: true,
});

export default function NotFound() {
  return (
    <StatusPage
      eyebrow={notFoundPage.eyebrow}
      title={notFoundPage.title}
      lead={notFoundPage.lead}
      actions={
        <>
          <Button asChild variant="primary" size="lg">
            <Link href={routes.home}>{notFoundPage.actions.home}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={routes.contact}>{notFoundPage.actions.contact}</Link>
          </Button>
        </>
      }
    />
  );
}
