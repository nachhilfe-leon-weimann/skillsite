import { expect, test } from "vitest";

import { canonicalAddress, clientAddressFromHeaders } from "./client-address";

// Documentation ranges (RFC 5737, RFC 3849): no real address.
const VISITOR = "203.0.113.4";
const CLOUDFLARE_EDGE = "198.51.100.2";

test("behind Cloudflare, the visitor's address comes from cf-connecting-ip", () => {
  expect(
    clientAddressFromHeaders(
      new Headers({
        "cf-connecting-ip": VISITOR,
        "x-forwarded-for": `192.0.2.99, ${CLOUDFLARE_EDGE}`,
        "x-real-ip": CLOUDFLARE_EDGE,
      }),
    ),
  ).toBe(VISITOR);
});

test("without Cloudflare, the first forwarded entry, then the real-ip header, else none", () => {
  expect(
    clientAddressFromHeaders(
      new Headers({ "x-forwarded-for": ` ${VISITOR} , 10.0.0.2` }),
    ),
  ).toBe(VISITOR);
  expect(
    clientAddressFromHeaders(
      new Headers({ "cf-connecting-ip": " ", "x-real-ip": VISITOR }),
    ),
  ).toBe(VISITOR);
  expect(clientAddressFromHeaders(new Headers())).toBe(undefined);
});

test("one address has one textual form", () => {
  expect(canonicalAddress(VISITOR)).toBe(VISITOR);
  expect(canonicalAddress("2001:0DB8:0000:0000:0000:0000:0000:0007")).toBe(
    "2001:db8::7",
  );
  expect(canonicalAddress("2001:db8::7%eth0")).toBe("2001:db8::7");
  // An IPv6 form that carries an IPv4 visitor is that visitor.
  expect(canonicalAddress(`::ffff:${VISITOR}`)).toBe(VISITOR);
  expect(canonicalAddress(`64:ff9b::${VISITOR}`)).toBe(VISITOR);
});

test("anything that is no IP address has no textual form", () => {
  for (const value of [undefined, "", "unknown", "2001:db8:::1", "300.1.1.1"]) {
    expect(canonicalAddress(value), String(value)).toBe(null);
  }
});
