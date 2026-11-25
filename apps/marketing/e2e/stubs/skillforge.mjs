/**
 * A local SkillForge for the payment page's browser tests: the two endpoints the lookup calls, with synthetic
 * invoices only, one per answer the page can get. Plain `node:http`, bound to 127.0.0.1.
 * `node apps/marketing/e2e/stubs/skillforge.mjs [port]`  port defaults to 3199
 *
 * Run the app against it with `SKILLFORGE_API_URL=http://127.0.0.1:3199`, `SKILLFORGE_CLIENT_ID=marketing-e2e` and
 * `SKILLFORGE_CLIENT_SECRET=sf_synthetic_secret` (`playwright.config.ts` does).
 */
import { createServer } from "node:http";

const STUB_PORT = 3199;

/** The synthetic client the stub accepts; no real SkillForge knows it. */
const CLIENT = { id: "marketing-e2e", secret: "sf_synthetic_secret" };

/** The one token the stub issues; its lifetime stays above the client's refresh margin, so the app caches it. */
const TOKEN = { access_token: "stub", token_type: "bearer", expires_in: 3600 };

/** A non-2xx answer in SkillForge's `ErrorResponse` shape, with the contract's example codes. */
const error = (status, code, detail) => ({ status, body: { code, detail } });

const NOT_PAYABLE = error(
  404,
  "invoice_not_payable",
  "No payable invoice has this number",
);

/** The invoices the stub knows, by number: the status and body SkillForge would answer. */
const INVOICES = new Map([
  ["RE-1001", paymentRequest("RE-1001", "open", 2250, "allowed")],
  ["RE-1002", paymentRequest("RE-1002", "open", 2250, "blocked")],
  ["RE-1003", paymentRequest("RE-1003", "paid", 0, "allowed")],
  ["RE-1004", NOT_PAYABLE],
  ["RE-1005", error(502, "sevdesk_unavailable", "sevDesk could not be read")],
]);
const NOT_FOUND = error(404, "not_found", "Not found");
const UNAUTHORIZED = error(
  401,
  "unauthorized",
  "Invalid authentication credentials",
);

const PAYMENT_REQUEST_PATH = /^\/api\/v1\/billing\/payment-requests\/([^/]+)$/;

function paymentRequest(invoice, state, openAmountCents, paypal) {
  return {
    status: 200,
    body: {
      invoice_number: invoice,
      state,
      open_amount_cents: openAmountCents,
      paypal,
    },
  };
}

function send(response, { status, body }) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

const EXPECTED_BASIC = `Basic ${Buffer.from(`${CLIENT.id}:${CLIENT.secret}`, "utf8").toString("base64")}`;

/** The token request: HTTP Basic with the synthetic client and a `client_credentials` form body. */
function issueToken(request, response) {
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => {
    body += chunk;
  });
  request.on("end", () => {
    const grant = new URLSearchParams(body).get("grant_type");
    if (
      request.headers.authorization !== EXPECTED_BASIC ||
      grant !== "client_credentials"
    ) {
      send(response, UNAUTHORIZED);
      return;
    }
    send(response, { status: 200, body: TOKEN });
  });
}

function handle(request, response) {
  const { pathname } = new URL(request.url ?? "/", "http://127.0.0.1");

  if (request.method === "GET" && pathname === "/health") {
    send(response, { status: 200, body: { status: "ok" } });
    return;
  }
  if (request.method === "POST" && pathname === "/api/v1/auth/token") {
    issueToken(request, response);
    return;
  }
  const match = PAYMENT_REQUEST_PATH.exec(pathname);
  if (request.method === "GET" && match) {
    if (request.headers.authorization !== `Bearer ${TOKEN.access_token}`) {
      send(response, UNAUTHORIZED);
      return;
    }
    // Every other number is one SkillForge has no payable invoice for.
    send(response, INVOICES.get(match[1]) ?? NOT_PAYABLE);
    return;
  }
  send(response, NOT_FOUND);
}

/**
 * Starts the stub on 127.0.0.1.
 *
 * @param {number} [port]
 */
function startSkillforgeStub(port = STUB_PORT) {
  const server = createServer(handle);
  server.listen(port, "127.0.0.1", () => {
    console.log(`[skillforge-stub] listening on http://127.0.0.1:${port}`);
  });
  return server;
}

if (import.meta.main) {
  startSkillforgeStub(Number(process.argv[2] ?? STUB_PORT));
}
