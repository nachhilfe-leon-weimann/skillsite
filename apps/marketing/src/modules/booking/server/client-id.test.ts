import assert from "node:assert/strict";
import { test } from "vitest";

import { clientIdFromHeaders } from "./client-id";

// Documentation ranges (RFC 5737, RFC 3849): no real address.
const VISITOR_A = "203.0.113.4";
const VISITOR_B = "2001:db8::7";
const CLOUDFLARE_EDGE = "198.51.100.2";

test("behind Cloudflare, visitors sharing an edge address keep their own identity", () => {
  // Traefik replaces the forwarded chain with the edge address it sees.
  const viaEdge = (visitor: string) =>
    new Headers({
      "cf-connecting-ip": visitor,
      "x-forwarded-for": CLOUDFLARE_EDGE,
      "x-real-ip": CLOUDFLARE_EDGE,
    });

  assert.equal(clientIdFromHeaders(viaEdge(VISITOR_A)), VISITOR_A);
  assert.equal(clientIdFromHeaders(viaEdge(VISITOR_B)), VISITOR_B);
});

test("behind Cloudflare, a client-sent forwarded chain does not choose the identity", () => {
  // Cloudflare appends to a client-sent X-Forwarded-For, so its first entry is the client's choice.
  assert.equal(
    clientIdFromHeaders(
      new Headers({
        "cf-connecting-ip": VISITOR_A,
        "x-forwarded-for": `192.0.2.99, ${VISITOR_A}, ${CLOUDFLARE_EDGE}`,
      }),
    ),
    VISITOR_A,
  );
});

test("without Cloudflare, the first forwarded entry, then the real-ip header", () => {
  assert.equal(
    clientIdFromHeaders(
      new Headers({
        "x-forwarded-for": `${VISITOR_A}, 10.0.0.2`,
        "x-real-ip": CLOUDFLARE_EDGE,
      }),
    ),
    VISITOR_A,
  );
  assert.equal(
    clientIdFromHeaders(new Headers({ "x-real-ip": VISITOR_B })),
    VISITOR_B,
  );
  assert.equal(clientIdFromHeaders(new Headers()), "unknown");
});

test("blank headers fall through to the next source", () => {
  assert.equal(
    clientIdFromHeaders(
      new Headers({
        "cf-connecting-ip": "  ",
        "x-forwarded-for": " , 10.0.0.2",
        "x-real-ip": VISITOR_B,
      }),
    ),
    VISITOR_B,
  );
});

test("an oversized header is kept under a bounded key", () => {
  assert.equal(
    clientIdFromHeaders(new Headers({ "cf-connecting-ip": "a".repeat(256) }))
      .length,
    128,
  );
  assert.equal(
    clientIdFromHeaders(new Headers({ "x-forwarded-for": "a".repeat(256) }))
      .length,
    128,
  );
});
