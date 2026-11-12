import type { NextConfig } from "next";

import { appConfig } from "@skillsite/config/next/app-config.mjs";

// Standalone output, the version for /health and the security headers come from the workspace's shared app config.
const nextConfig: NextConfig = appConfig({ appDir: __dirname });

export default nextConfig;
