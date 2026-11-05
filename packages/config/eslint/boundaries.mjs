import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Import boundaries of the workspace, as `import/no-restricted-paths` zones.
 * The plugin comes from `next.mjs` (eslint-config-next): spread that preset
 * first, then add these configs.
 */

/** Files the `next.mjs` preset lints, which registers the `import` plugin. */
const FILES = ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"];

/** The two public entries of a module; everything else in it is internal. */
const MODULE_ENTRIES = ["./index.ts", "./server.ts"];

const directories = (dir) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

/**
 * Inside a module, the client-safe parts (`index.ts`, `model/`, `components/`)
 * never import the module's server code (`server/`, `server.ts`), so nothing
 * server-only reaches a client bundle through them. One exception: a component
 * calls a server action by importing its `"use server"` module, which is
 * `server/actions.ts` by convention; Next.js bundles only a reference to it.
 *
 * @param {string} name the module's directory name
 */
function clientSafeZones(name) {
  const own = (part) => `./src/modules/${name}/${part}`;
  const message = `Client-safe code of modules/${name} (index.ts, model/, components/) never imports its server code; components/ may import server/actions.ts.`;
  return [
    {
      target: [own("index.ts"), own("model"), own("components")],
      from: own("server.ts"),
      message,
    },
    {
      target: [own("index.ts"), own("model")],
      from: own("server"),
      message,
    },
    {
      target: own("components"),
      from: own("server"),
      except: ["./actions.ts"],
      message,
    },
  ];
}

/**
 * Module rules of an app: outside a module, code imports only the module's
 * `index.ts` (client-safe) or `server.ts` (server entry), never a deeper path.
 * The modules are the directories of `<appRoot>/src/modules/`; each one is
 * closed to every other top-level entry of `src/` and to every other module,
 * and its client-safe parts are closed to its own server code.
 *
 * @param {string} appRoot absolute path of the app (the zones' `basePath`)
 */
export function moduleBoundaries(appRoot) {
  const src = path.join(appRoot, "src");
  const modulesDir = path.join(src, "modules");
  const modules = existsSync(modulesDir) ? directories(modulesDir) : [];
  const outside = readdirSync(src)
    .filter((entry) => entry !== "modules")
    .sort()
    .map((entry) => `./src/${entry}`);

  const zones = modules.flatMap((name) => [
    {
      target: [
        ...outside,
        ...modules
          .filter((other) => other !== name)
          .map((other) => `./src/modules/${other}`),
      ],
      from: `./src/modules/${name}`,
      except: MODULE_ENTRIES,
      message: `Import modules/${name} through its index.ts or server.ts.`,
    },
    ...clientSafeZones(name),
  ]);

  return {
    name: "skillsite/module-boundaries",
    files: FILES,
    // The rule rejects an empty zone list: an app without modules has no rule.
    rules:
      zones.length > 0
        ? {
            "import/no-restricted-paths": [
              "error",
              { basePath: appRoot, zones },
            ],
          }
        : {},
  };
}

/**
 * Package rule: a shared package imports nothing from an app.
 *
 * @param {string} packageRoot absolute path of the package (the zone's `basePath`)
 */
export function packageBoundaries(packageRoot) {
  return {
    name: "skillsite/package-boundaries",
    files: FILES,
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          basePath: packageRoot,
          zones: [
            {
              target: "./",
              from: "../../apps",
              message: "A shared package imports nothing from an app.",
            },
          ],
        },
      ],
    },
  };
}
