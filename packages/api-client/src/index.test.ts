import { expect, test } from "vitest";

import { createSkillforgeClient } from "./index";

test("a call goes to SkillForge's origin through the fetch the caller passes in", async () => {
  const requests: Request[] = [];
  const client = createSkillforgeClient({
    baseUrl: "http://skillforge.test",
    fetch: async (request) => {
      requests.push(request);
      return Response.json({
        client_id: "portal",
        party_id: null,
        principal_type: "user",
        roles: ["admin"],
        scopes: [],
        user_id: "00000000-0000-4000-8000-000000000001",
      });
    },
  });

  const { data } = await client.GET("/api/v1/auth/me");

  expect(requests.map((request) => request.url)).toEqual([
    "http://skillforge.test/api/v1/auth/me",
  ]);
  expect(data?.roles).toEqual(["admin"]);
});
