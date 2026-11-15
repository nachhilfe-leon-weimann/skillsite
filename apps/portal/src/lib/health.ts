import { appVersion } from "@/lib/env";

/**
 * The health report the deploy checks, the same as the marketing app's: it polls the endpoint until `status` is
 * `"ok"` and `version` is the version it just released (skill-platform release flow, decision J).
 *
 * `APP_VERSION` is inlined at build time by `next.config.ts`, which reads the root `package.json`; an image somehow
 * built without one reports `"unknown"` - a failing deploy rather than a wrong version.
 */

export type HealthReport = {
  status: "ok";
  version: string;
};

export function healthReport(version: string = appVersion()): HealthReport {
  return { status: "ok", version };
}
