import { appVersion } from "@/lib/env";

/**
 * The health report the deploy checks: it polls the endpoint until `status` is
 * `"ok"` and `version` is the version it just released, so a container still
 * running the old image turns the deploy red (skill-platform release flow,
 * decision J).
 *
 * `APP_VERSION` is inlined at build time by `next.config.ts`, which reads the
 * root `package.json`. It cannot be read at runtime: the standalone bundle the
 * image ships carries no root `package.json`. An image somehow built without
 * one reports `"unknown"` - a failing deploy rather than a wrong version.
 */

export type HealthReport = {
  status: "ok";
  version: string;
};

export function healthReport(version: string = appVersion()): HealthReport {
  return { status: "ok", version };
}
