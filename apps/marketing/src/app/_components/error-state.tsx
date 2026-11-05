import Link from "next/link";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { routes } from "@/lib/routes";

/** The error page's eyebrow; `global-error.tsx` also names its tab after it. */
export const errorEyebrow = "Ein Fehler ist aufgetreten";

/**
 * The error page's content: what went wrong, a retry and the way to contact.
 * The error boundaries render it: `error.tsx` inside the layout,
 * `global-error.tsx` in place of it.
 */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <StatusPage
      eyebrow={errorEyebrow}
      title="Da ist etwas schiefgelaufen."
      lead={
        <>
          Bitte versuch es noch einmal. Wenn es weiterhin klemmt, schreib mir
          einfach direkt – wir kriegen das hin.
        </>
      }
      actions={
        <>
          <Button variant="primary" size="lg" onClick={onRetry}>
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
