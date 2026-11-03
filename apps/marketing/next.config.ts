import { readFileSync } from "node:fs";
import path from "node:path";

import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "../..");

// The released version has to be baked into the image: `/health` reports it so the
// deploy can prove the new version is the one answering, and the standalone bundle
// the image ships carries no root `package.json` to read it from at runtime.
const { version } = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
) as { version?: string };

if (!version) {
  throw new Error(
    "The root package.json carries no version - /health would report none.",
  );
}

// Baseline security headers applied to every response. Intentionally excludes a
// Content-Security-Policy: a strict CSP needs per-request nonces for the theme
// script and an allowlist for the Umami tracker, so it's deferred to its own
// change rather than risking silent breakage here.
const securityHeaders = [
  // Force HTTPS for two years (HTTP→HTTPS redirect already happens at the edge).
  // No `preload` on purpose — that's a commitment for the whole apex domain.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Don't let browsers MIME-sniff responses away from their declared type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin as referrer on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Clickjacking protection: the site is never meant to be framed elsewhere.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Disable powerful features the site doesn't use, incl. the Topics API.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // The root AGENTS.md is the repo's only agent anchor; `next dev` would otherwise write one into apps/marketing/.
  agentRules: false,
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime image ships only the server plus the node_modules it actually uses.
  output: "standalone",
  // The app lives in a pnpm workspace; trace files from the repo root so the
  // standalone bundle includes dependencies hoisted to the root store.
  outputFileTracingRoot: repoRoot,
  // Inlined into the bundle at build time; `/health` reports it as `version`.
  env: { APP_VERSION: version },
  // Internal packages ship TypeScript sources; Next compiles them in place.
  transpilePackages: ["@skillsite/ui"],
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
    : [],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
