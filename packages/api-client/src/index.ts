import createClient, { type Client, type ClientOptions } from "openapi-fetch";

import type { paths } from "./schema";

export type { components, operations, paths } from "./schema";
export type { Middleware } from "openapi-fetch";

/** A client for SkillForge's API: every path, parameter, body and response is typed by the vendored contract. */
export type SkillforgeClient = Client<paths>;

/**
 * openapi-fetch's client options with a required `baseUrl` (SkillForge's origin, without `/api/v1`). `fetch`,
 * `headers` and the rest pass through; authentication is added per client with `client.use(middleware)`.
 */
export type SkillforgeClientOptions = ClientOptions & { baseUrl: string };

export function createSkillforgeClient(
  options: SkillforgeClientOptions,
): SkillforgeClient {
  return createClient<paths>(options);
}
