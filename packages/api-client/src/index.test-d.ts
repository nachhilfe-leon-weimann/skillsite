/**
 * Type tests, checked by `just typecheck` (tsc) and never run: a call the contract allows compiles, and each
 * `@ts-expect-error` fails the type check as soon as the call it marks compiles.
 */
import { createSkillforgeClient, type components } from "./index";

const client = createSkillforgeClient({ baseUrl: "http://localhost:8000" });

export async function currentUser(): Promise<
  components["schemas"]["MeResponse"] | undefined
> {
  const { data } = await client.GET("/api/v1/auth/me");
  return data;
}

export async function unknownPath() {
  // @ts-expect-error the contract has no such path
  await client.GET("/api/v1/auth/whoami", {});
}

export async function wrongMethod() {
  // @ts-expect-error /api/v1/auth/me answers GET only
  await client.POST("/api/v1/auth/me", {});
}

export async function wrongBody() {
  await client.POST("/api/v1/auth/revoke", {
    // @ts-expect-error the revoke request carries a refresh token, not a password
    body: { password: "synthetic" },
  });
}
