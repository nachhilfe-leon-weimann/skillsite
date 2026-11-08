/**
 * Prepares an app's standalone build to run the way the Docker image runs it (Dockerfile, runner stage):
 * `output: "standalone"` leaves `.next/static` and most of `public/` out of the bundle, so they are copied in next
 * to the server entry, which then starts with `node <bundle>/apps/<app>/server.js`.
 * `node scripts/prepare-standalone.mjs [appDir]`  appDir defaults to the working directory
 */
import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The bundle mirrors the repo layout (the tracing root is the repo root), so the app sits at its repo path inside
 * `.next/standalone`.
 *
 * @param {string} appDir absolute path of the app
 * @param {string} [root] absolute path of the repo
 */
export function standaloneLayout(appDir, root = repoRoot) {
  const app = path.join(
    appDir,
    ".next",
    "standalone",
    path.relative(root, appDir),
  );
  return {
    server: path.join(app, "server.js"),
    copies: [
      {
        from: path.join(appDir, ".next", "static"),
        to: path.join(app, ".next", "static"),
      },
      { from: path.join(appDir, "public"), to: path.join(app, "public") },
    ],
  };
}

/**
 * Copies the static assets into the bundle, merging into what Next traced there already, as `COPY` does.
 *
 * @param {string} appDir absolute path of the app
 * @param {string} [root] absolute path of the repo
 */
export function prepareStandalone(appDir, root = repoRoot) {
  const layout = standaloneLayout(appDir, root);
  if (!existsSync(layout.server)) {
    throw new Error(
      `No standalone server at ${path.relative(root, layout.server)}: build the app first (just build).`,
    );
  }
  for (const { from, to } of layout.copies) {
    cpSync(from, to, { recursive: true, force: true });
  }
  return layout;
}

if (import.meta.main) {
  prepareStandalone(path.resolve(process.argv[2] ?? process.cwd()));
}
