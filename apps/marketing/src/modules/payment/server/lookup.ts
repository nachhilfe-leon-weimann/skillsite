import "server-only";

import {
  createServiceTokenSource,
  createSkillforgeClient,
  type components,
  type ServiceTokenSource,
  type SkillforgeClient,
} from "@skillsite/api-client";
import * as z from "zod/mini";

import { serverEnv } from "@/lib/env";

import type { PaymentLookup } from "../model/payment-state";

/**
 * Asks SkillForge for the payment state of one invoice. Fails closed: only a
 * `200` whose body keeps the contract and names the asked number is an answer;
 * a `404` is "not payable"; everything else - no token, a second `401`, `429`,
 * `5xx`, any other status, a thrown fetch, the timeout - is `unavailable`.
 * Nothing is logged here: the page writes the request's one `[payment]` line.
 */

/** SkillForge's answer, aliased: `invoice-link.ts` has a `PaymentRequest` of its own. */
type SkillforgePaymentRequest = components["schemas"]["PaymentRequest"];

/** How long one lookup request, body included, may take. */
export const LOOKUP_TIMEOUT_MS = 5000;

export type LookupInvoice = (invoice: string) => Promise<PaymentLookup>;

const UNAVAILABLE: PaymentLookup = { kind: "unavailable" };

/** The four fields skillsite reads; anything else in the body is ignored. */
const paymentRequestSchema = z.object({
  invoice_number: z.string(),
  state: z.enum(["open", "paid"]),
  open_amount_cents: z.int().check(z.minimum(0)),
  paypal: z.enum(["allowed", "blocked"]),
}) satisfies z.ZodMiniType<SkillforgePaymentRequest>;

type Attempt = { status: number; data: unknown } | null;

export function createLookup(deps: {
  client: SkillforgeClient;
  tokens: ServiceTokenSource;
  timeoutMs?: number;
}): LookupInvoice {
  const { client, tokens, timeoutMs = LOOKUP_TIMEOUT_MS } = deps;

  /** One request with the given token; `null` when it threw or timed out. */
  async function attempt(invoice: string, token: string): Promise<Attempt> {
    // A timer the whole call shares, so a body that stalls is cut off too.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const { data, response } = await client.GET(
        "/api/v1/billing/payment-requests/{invoice_number}",
        {
          params: { path: { invoice_number: invoice } },
          // The bearer token rides on this call only; the token client stays without middleware.
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          redirect: "error",
          signal: controller.signal,
        },
      );
      return { status: response.status, data };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  function toLookup(invoice: string, result: Attempt): PaymentLookup {
    if (result?.status === 404) return { kind: "not_payable" };
    if (result?.status !== 200) return UNAVAILABLE;

    const parsed = paymentRequestSchema.safeParse(result.data);
    if (!parsed.success) return UNAVAILABLE;
    const body = parsed.data;
    // The number is the one SkillForge confirmed, never only the one asked.
    if (body.invoice_number !== invoice) return UNAVAILABLE;
    if (body.state === "paid") return { kind: "paid" };
    return {
      kind: "open",
      amountCents: body.open_amount_cents,
      paypal: body.paypal,
    };
  }

  return async (invoice) => {
    try {
      const token = await tokens.token();
      if (!token) return UNAVAILABLE;
      let result = await attempt(invoice, token);

      if (result?.status === 401) {
        // A token SkillForge no longer takes: drop it and try once with a fresh one.
        tokens.invalidate();
        const fresh = await tokens.token();
        if (!fresh) return UNAVAILABLE;
        // Once only: a second 401 falls through to `unavailable`.
        result = await attempt(invoice, fresh);
      }
      return toLookup(invoice, result);
    } catch {
      return UNAVAILABLE;
    }
  };
}

/** The process's lookup, built on first use; `null` while SkillForge is unconfigured. */
let runtime: LookupInvoice | null | undefined;

function runtimeLookup(): LookupInvoice | null {
  if (runtime !== undefined) return runtime;
  const {
    SKILLFORGE_API_URL: baseUrl,
    SKILLFORGE_CLIENT_ID: clientId,
    SKILLFORGE_CLIENT_SECRET: clientSecret,
  } = serverEnv();
  if (!baseUrl || !clientId || !clientSecret) {
    runtime = null;
    return runtime;
  }
  // One plain client, without middleware: the token request sends its own Basic header, the lookup its bearer.
  const client = createSkillforgeClient({ baseUrl });
  runtime = createLookup({
    client,
    tokens: createServiceTokenSource({
      client,
      credentials: { clientId, clientSecret },
    }),
  });
  return runtime;
}

/** Looks an invoice up in SkillForge; unconfigured, it answers `unavailable` without a request. */
export function lookupInvoice(invoice: string): Promise<PaymentLookup> {
  const lookup = runtimeLookup();
  return lookup ? lookup(invoice) : Promise.resolve(UNAVAILABLE);
}
