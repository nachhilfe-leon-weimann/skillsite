import Link from "next/link";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { errorPage } from "@/content/status";
import { routes } from "@/lib/routes";

/**
 * The error page's content: what went wrong, a retry and the way to contact.
 * The error boundaries render it: `error.tsx` inside the layout,
 * `global-error.tsx` in place of it.
 */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <StatusPage
      eyebrow={errorPage.eyebrow}
      title={errorPage.title}
      lead={errorPage.lead}
      actions={
        <>
          <Button variant="primary" size="lg" onClick={onRetry}>
            {errorPage.actions.retry}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={routes.contact}>{errorPage.actions.contact}</Link>
          </Button>
        </>
      }
    />
  );
}
