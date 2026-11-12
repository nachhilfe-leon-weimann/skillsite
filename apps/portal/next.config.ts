import type { NextConfig } from "next";

import { appConfig } from "@skillsite/config/next/app-config.mjs";

// Standalone output, the version for /health and the security headers come from the workspace's shared app config.
const nextConfig: NextConfig = appConfig({
  appDir: __dirname,
  // The admin area is never framed, not even by the portal itself.
  frameOptions: "DENY",
  // The portal stays out of search engines: every response, redirects and /health included, says so.
  headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
});

export default nextConfig;
