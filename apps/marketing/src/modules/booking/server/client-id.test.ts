import assert from "node:assert/strict";
import { test } from "vitest";

import { clientIdFromHeaders } from "./client-id";

// Documentation ranges (RFC 5737, RFC 3849): no real address.
const VISITOR_A = "203.0.113.4";
const VISITOR_B = "2001:db8::7";
const VISITOR_B_KEY = "2001:db8:0:0::/64";
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
  assert.equal(clientIdFromHeaders(viaEdge(VISITOR_B)), VISITOR_B_KEY);
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
    VISITOR_B_KEY,
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
    VISITOR_B_KEY,
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

test("an IPv6 visitor is keyed by its /64, so rotating within it keeps one key", () => {
  const id = (address: string) =>
    clientIdFromHeaders(new Headers({ "cf-connecting-ip": address }));

  assert.equal(id("2001:db8:12:34::1"), "2001:db8:12:34::/64");
  assert.equal(
    id("2001:0DB8:0012:0034:aaaa:bbbb:cccc:dddd"),
    "2001:db8:12:34::/64",
  );
  assert.equal(id("2001:db8::7"), "2001:db8:0:0::/64");
  assert.equal(id("2001:db8:12:34:5::"), "2001:db8:12:34::/64");
  assert.equal(id("::1"), "0:0:0:0::/64");
  // A different /64 is a different visitor.
  assert.notEqual(id("2001:db8:12:35::1"), id("2001:db8:12:34::1"));
});

test("IPv6 with a zone or an embedded IPv4 is keyed like any other", () => {
  const id = (address: string) =>
    clientIdFromHeaders(new Headers({ "x-forwarded-for": address }));

  assert.equal(id("fe80::1%eth0"), "fe80:0:0:0::/64");
  assert.equal(id("64:ff9b::192.0.2.33"), "64:ff9b:0:0::/64");
  // An IPv4-mapped address (Node's socket form) is the IPv4 visitor itself.
  assert.equal(id("::ffff:192.0.2.33"), "192.0.2.33");
  assert.equal(id("::FFFF:c000:221"), "192.0.2.33");
});

test("an IPv4 address and anything unparsable stay as they are", () => {
  const id = (address: string) =>
    clientIdFromHeaders(new Headers({ "cf-connecting-ip": address }));

  assert.equal(id("203.0.113.4"), "203.0.113.4");
  assert.equal(id("not-an-address"), "not-an-address");
  assert.equal(id("2001:db8:::1"), "2001:db8:::1");
});
