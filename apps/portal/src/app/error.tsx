"use client";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { errorPage } from "@/content/status";

/**
 * A page that could not be built: in the admin area most likely because SkillForge did not answer
 * (`SkillforgeUnavailableError`). The session is kept, so trying again is all it takes once SkillForge is back.
 */
export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <StatusPage
      eyebrow={errorPage.eyebrow}
      title={errorPage.title}
      lead={errorPage.lead}
      actions={
        <Button variant="primary" size="lg" onClick={() => retry()}>
          {errorPage.actions.retry}
        </Button>
      }
    />
  );
}
