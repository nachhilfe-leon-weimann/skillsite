"use client";

import { useEffect } from "react";

import { ErrorState } from "./_components/error-state";

/**
 * Route-level error boundary. Mirrors not-found.tsx so an uncaught render error
 * (e.g. in the client-side Booker) degrades to a calm, on-brand page with a
 * retry instead of Next's bare default.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState onRetry={retry} />;
}
