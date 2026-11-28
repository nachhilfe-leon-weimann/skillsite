import "server-only";

import { headers } from "next/headers";

/**
 * Real client IP behind Traefik (Dokploy), for the per-IP rate limits of the
 * public form actions. Traefik sets `x-forwarded-for` and strips client-spoofed
 * values as long as the app is only reachable via Traefik; the first entry is
 * the original client.
 */
export async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip")?.trim() || "unknown";
}
