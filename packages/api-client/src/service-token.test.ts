import { expect, test } from "vitest";

import { createSkillforgeClient } from "./index";
import { createServiceTokenSource } from "./service-token";

const credentials = {
  clientId: "marketing-e2e",
  clientSecret: "sf_synthetic_secret",
};
const NOW = 1_700_000_000_000;

type Respond = (request: Request) => Response | Promise<Response>;

/** A token source over a recording fetch stub; `clock.now` is the time the source sees. */
function setup(respond: Respond) {
  const requests: Request[] = [];
  const bodies: string[] = [];
  const clock = { now: NOW };
  const client = createSkillforgeClient({
    baseUrl: "http://skillforge.test",
    fetch: async (request) => {
      requests.push(request.clone());
      bodies.push(await request.clone().text());
      return respond(request);
    },
  });
  const source = createServiceTokenSource({
    client,
    credentials,
    now: () => clock.now,
  });
  return { source, requests, bodies, clock };
}

const issued = (accessToken = "synthetic-token") =>
  Response.json({
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
  });

test("reuses a token until 60 seconds before it expires", async () => {
  const { source, requests, clock } = setup(() => issued());

  await source.token();
  clock.now = NOW + 3539_000;
  expect(await source.token()).toBe("synthetic-token");
  expect(requests).toHaveLength(1);

  clock.now = NOW + 3541_000;
  await source.token();
  expect(requests).toHaveLength(2);
});

test("shares one request between concurrent callers", async () => {
  const { source, requests } = setup(() => issued());

  const tokens = await Promise.all([source.token(), source.token()]);

  expect(tokens).toEqual(["synthetic-token", "synthetic-token"]);
  expect(requests).toHaveLength(1);
});

test("sends HTTP Basic and the client_credentials grant", async () => {
  const { source, requests, bodies } = setup(() => issued());

  await source.token();

  const [request] = requests;
  expect(request?.method).toBe("POST");
  expect(request?.url).toBe("http://skillforge.test/api/v1/auth/token");
  expect(request?.headers.get("authorization")).toBe(
    "Basic bWFya2V0aW5nLWUyZTpzZl9zeW50aGV0aWNfc2VjcmV0",
  );
  expect(request?.headers.get("content-type")).toContain(
    "application/x-www-form-urlencoded",
  );
  expect(bodies).toEqual(["grant_type=client_credentials"]);
  // A redirect is never followed: fetch would send the credentials on to wherever it points.
  expect(request?.redirect).toBe("error");
});

test("returns null on a refusal, a broken body and a network error", async () => {
  const refused = setup(() =>
    Response.json({ code: "invalid_client" }, { status: 401 }),
  );
  expect(await refused.source.token()).toBeNull();

  const broken = setup(() => Response.json({}));
  expect(await broken.source.token()).toBeNull();

  const unreachable = setup(() => Promise.reject(new TypeError("offline")));
  expect(await unreachable.source.token()).toBeNull();
});

test("fetches anew after invalidate", async () => {
  const { source, requests } = setup(() => issued());

  await source.token();
  source.invalidate();
  await source.token();

  expect(requests).toHaveLength(2);
});

test.each([
  ["an empty access_token", { access_token: "", expires_in: 3600 }],
  ["a zero lifetime", { access_token: "synthetic-token", expires_in: 0 }],
  ["a negative lifetime", { access_token: "synthetic-token", expires_in: -1 }],
  [
    "a fractional lifetime",
    { access_token: "synthetic-token", expires_in: 1.5 },
  ],
  [
    "a lifetime that is a string",
    { access_token: "synthetic-token", expires_in: "3600" },
  ],
])("returns null for %s", async (_name, body) => {
  const { source } = setup(() => Response.json(body));

  expect(await source.token()).toBeNull();
});

test("recovers after a failed request: nothing of the failure is kept", async () => {
  let calls = 0;
  const { source, requests } = setup(() =>
    ++calls === 1
      ? Response.json({ code: "invalid_client" }, { status: 401 })
      : issued(),
  );

  expect(await source.token()).toBeNull();
  expect(await source.token()).toBe("synthetic-token");
  expect(requests).toHaveLength(2);
});
