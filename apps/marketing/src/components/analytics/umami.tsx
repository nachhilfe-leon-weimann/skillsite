import Script from "next/script";

import { isProduction } from "@/lib/env";

// Umami - cookieless web analytics, self-hosted at insights.leonweimann.de.
//
// The website id is NOT a secret: it ships in the page HTML as data-website-id.
// It therefore lives here as a constant rather than a NEXT_PUBLIC_* env var,
// which the standalone Docker build would otherwise have to thread through as a
// build arg.
const UMAMI_SRC = "https://insights.leonweimann.de/script.js";

const UMAMI_WEBSITE_ID = "9214eb4f-0b92-48df-9514-a190e8fdb62b";

// Only this host reports events. The pre-release lernen.leonweimann.de domain
// stays untracked; nachhilfe.leonweimann.de starts counting automatically once
// the site goes live there — no code change needed at release.
const UMAMI_ALLOWED_DOMAINS = "nachhilfe.leonweimann.de";

export function UmamiAnalytics() {
  // Never load the tracker during local development.
  if (!isProduction()) return null;

  return (
    <Script
      src={UMAMI_SRC}
      data-website-id={UMAMI_WEBSITE_ID}
      data-domains={UMAMI_ALLOWED_DOMAINS}
      strategy="afterInteractive"
    />
  );
}
