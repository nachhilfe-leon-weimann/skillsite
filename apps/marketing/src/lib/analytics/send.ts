import "server-only";

import { createLogger } from "@/lib/log";
import { UMAMI_ENDPOINT, type UmamiPayload } from "./umami";

/** How long a report may take; past it, it is dropped. */
const SEND_TIMEOUT_MS = 3_000;

/**
 * `[analytics] failed {"cause":"timeout"}`: a report that did not arrive. The
 * line never holds the payload, so no IP address or User-Agent reaches the log.
 */
const logAnalytics = createLogger<"failed">("analytics", { failed: "warn" });

/** The cause of a failed `fetch`, without its message. */
function failureCause(error: unknown): string {
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  return "network";
}

/**
 * Send one report to Umami. Never throws and never holds up a response: call
 * it from `after()` or `event.waitUntil()`. A failure leaves one log line.
 */
export async function sendToUmami(payload: UmamiPayload): Promise<void> {
  try {
    const response = await fetch(UMAMI_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "event", payload }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      cache: "no-store",
    });
    // The answer carries nothing we need; release the connection.
    await response.body?.cancel().catch(() => {});
    if (!response.ok) logAnalytics("failed", { status: response.status });
  } catch (error) {
    logAnalytics("failed", { cause: failureCause(error) });
  }
}
