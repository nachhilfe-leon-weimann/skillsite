import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The Next.js config every app of the workspace shares: the Docker image, `/health` and the security headers work
 * the same in each one. An app passes its directory and what sets it apart, and exports the result from its
 * `next.config.ts`.
 */

/**
 * Baseline security headers applied to every response. Intentionally excludes a Content-Security-Policy: a strict
 * CSP needs per-request nonces for the theme script and, on the website, an allowlist for the Umami tracker, so it's
 * deferred to its own change rather than risking silent breakage here.
 *
 * @param {object} options
 * @param {"SAMEORIGIN" | "DENY"} options.frameOptions who may frame the app's pages
 */
export function securityHeaders({ frameOptions }) {
  return [
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
    // Clickjacking protection: no app is meant to be framed elsewhere.
    { key: "X-Frame-Options", value: frameOptions },
    // Disable powerful features the apps don't use, incl. the Topics API.
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
  ];
}

/**
 * The released version, from the root `package.json`. It has to be baked into the image: `/health` reports it so
 * the deploy can prove the new version is the one answering, and the standalone bundle the image ships carries no
 * root `package.json` to read it from at runtime.
 *
 * @param {string} repoRoot absolute path of the repo
 */
export function releasedVersion(repoRoot) {
  const { version } = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );
  if (!version) {
    throw new Error(
      "The root package.json carries no version - /health would report none.",
    );
  }
  return /** @type {string} */ (version);
}

/**
 * The shared part of an app's Next.js config.
 *
 * @param {object} options
 * @param {string} options.appDir absolute path of the app (`__dirname` in its `next.config.ts`)
 * @param {"SAMEORIGIN" | "DENY"} [options.frameOptions] `X-Frame-Options`; `SAMEORIGIN` by default
 * @param {{ key: string; value: string }[]} [options.headers] further headers for every response, after the baseline
 */
export function appConfig({
  appDir,
  frameOptions = "SAMEORIGIN",
  headers = [],
}) {
  const repoRoot = path.join(appDir, "../..");
  const responseHeaders = [...securityHeaders({ frameOptions }), ...headers];
  return {
    // The root AGENTS.md is the repo's only agent anchor; `next dev` would otherwise write one into the app.
    agentRules: false,
    // Emit a self-contained server bundle (.next/standalone) so the Docker
    // runtime image ships only the server plus the node_modules it actually uses.
    output: /** @type {const} */ ("standalone"),
    // The app lives in a pnpm workspace; trace files from the repo root so the
    // standalone bundle includes dependencies hoisted to the root store.
    outputFileTracingRoot: repoRoot,
    // Inlined into the bundle at build time; `/health` reports it as `version`.
    env: { APP_VERSION: releasedVersion(repoRoot) },
    // Internal packages ship TypeScript sources; Next compiles them in place.
    transpilePackages: ["@skillsite/ui", "@skillsite/api-client"],
    allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
      ? process.env.ALLOWED_DEV_ORIGINS.split(",")
      : [],
    async headers() {
      return [{ source: "/:path*", headers: responseHeaders }];
    },
  };
}
