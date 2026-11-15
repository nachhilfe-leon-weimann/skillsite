import type { Metadata } from "next";
import Link from "next/link";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { notFoundPage } from "@/content/status";
import { routes } from "@/lib/routes";

export const metadata: Metadata = notFoundPage.metadata;

export default function NotFound() {
  return (
    <StatusPage
      eyebrow={notFoundPage.eyebrow}
      title={notFoundPage.title}
      lead={notFoundPage.lead}
      actions={
        <Button asChild variant="primary" size="lg">
          <Link href={routes.home}>{notFoundPage.actions.home}</Link>
        </Button>
      }
    />
  );
}
