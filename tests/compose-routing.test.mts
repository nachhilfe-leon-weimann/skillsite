/**
 * compose.yml owns the site's Traefik routing.
 *
 * Dokploy strips every label that targets a router it generates for a domain entry and writes its
 * own, so a label that only adjusts such a router (say, its TLS options) is dropped at deploy time
 * without a trace. These tests keep the routing self-contained: every router the labels touch is
 * defined here and points at a service of the app's port, HTTPS requires Cloudflare's client
 * certificate (Authenticated Origin Pulls), and plain HTTP only redirects.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import { test } from "vitest";

type Service = { labels?: string[]; networks?: string[]; expose?: string[] };
type Compose = {
  services: Record<string, Service>;
  networks?: Record<string, { external?: boolean }>;
};

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const compose = load(
  readFileSync(path.join(root, "compose.yml"), "utf8"),
) as Compose;
const app = compose.services.app;
assert.ok(app, "compose.yml has no `app` service");

const labels = new Map(
  (app.labels ?? []).map((label) => {
    const separator = label.indexOf("=");
    return [label.slice(0, separator), label.slice(separator + 1)] as const;
  }),
);
const routerLabel = /^traefik\.http\.routers\.(?<router>[^.]+)\.(?<key>.+)$/;
const routers = new Map<string, Map<string, string>>();
for (const [key, value] of labels) {
  const match = routerLabel.exec(key);
  if (!match?.groups) continue;
  const { router = "", key: setting = "" } = match.groups;
  routers.set(router, (routers.get(router) ?? new Map()).set(setting, value));
}
const onEntrypoint = (entrypoint: string) =>
  [...routers.values()].filter((settings) =>
    (settings.get("entrypoints") ?? "")
      .split(",")
      .map((name) => name.trim())
      .includes(entrypoint),
  );

test("every router the labels touch is defined in compose.yml", () => {
  assert.ok(routers.size > 0);
  for (const [router, settings] of routers) {
    for (const setting of ["rule", "entrypoints", "service"]) {
      assert.ok(settings.has(setting), `router ${router} has no ${setting}`);
    }
  }
});

test("every router sends traffic to a service on the app's exposed port", () => {
  for (const [router, settings] of routers) {
    const service = settings.get("service");
    const port = labels.get(
      `traefik.http.services.${service}.loadbalancer.server.port`,
    );
    assert.ok(port, `router ${router} names undefined service ${service}`);
    assert.ok(app.expose?.includes(port), `port ${port} is not exposed`);
  }
});

test("every HTTPS router requires Cloudflare's client certificate", () => {
  const secure = onEntrypoint("websecure");
  assert.ok(secure.length > 0);
  for (const settings of secure) {
    // Traefik picks a router's TLS options by SNI, which it reads from a plain Host() rule.
    assert.match(settings.get("rule") ?? "", /^Host\(`[^`]+`\)$/);
    assert.equal(settings.get("tls"), "true");
    assert.equal(settings.get("tls.options"), "cloudflare-origin-pull@file");
  }
});

test("plain HTTP only redirects to HTTPS", () => {
  const plain = onEntrypoint("web");
  assert.ok(plain.length > 0);
  for (const settings of plain) {
    assert.equal(settings.get("middlewares"), "redirect-to-https@file");
  }
});

test("Traefik reaches the app over the external Dokploy network", () => {
  assert.equal(labels.get("traefik.enable"), "true");
  assert.equal(labels.get("traefik.docker.network"), "dokploy-network");
  assert.ok(app.networks?.includes("dokploy-network"));
  assert.equal(compose.networks?.["dokploy-network"]?.external, true);
});
