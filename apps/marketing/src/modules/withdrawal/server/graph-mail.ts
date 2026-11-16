import type { WithdrawalMailConfig } from "@/lib/env";

import type { WithdrawalMessage } from "../model/mail";

/**
 * The single point of Microsoft Graph I/O: an app-only token (OAuth2 client
 * credentials) and `sendMail` from the withdrawal mailbox. Plain `fetch`, and
 * only to the two hosts below; a request elsewhere is refused before it is sent.
 *
 * A send ends in one of three states. `sent` needs Graph's 202. `refused`
 * needs proof that nothing went out: a 4xx answer, or a call never made.
 * Everything unproven - a timeout, a lost connection, a 5xx, an unexpected
 * success code - is `unknown`. A send is never retried.
 */

const TOKEN_HOST = "login.microsoftonline.com";
const GRAPH_HOST = "graph.microsoft.com";
const ALLOWED_HOSTS: ReadonlySet<string> = new Set([TOKEN_HOST, GRAPH_HOST]);

/** Per request; three requests at most per withdrawal. */
const TIMEOUT_MS = 8_000;

/** Why a request is not even sent. */
export class DisallowedHostError extends Error {
  constructor(url: URL) {
    super(`Refused a request to ${url.protocol}//${url.hostname}.`);
    this.name = "DisallowedHostError";
  }
}

/** `fetch`, limited to the Graph hosts, without redirects, with a timeout. */
async function graphFetch(url: URL, init: RequestInit): Promise<Response> {
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new DisallowedHostError(url);
  }
  return fetch(url, {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** What failed, for the log line: never a token, an address or a text. */
export type GraphFailure = {
  step: "token" | "acknowledgement" | "notice";
  /** The HTTP status, when Graph answered. */
  status?: number;
  /** `timeout`, `network` or `unreadable` when there was no usable answer. */
  cause?: "timeout" | "network" | "unreadable";
};

export type TokenResult =
  { ok: true; token: string } | { ok: false; failure: GraphFailure };

const cause = (error: unknown): GraphFailure["cause"] =>
  error instanceof Error &&
  (error.name === "TimeoutError" || error.name === "AbortError")
    ? "timeout"
    : "network";

/**
 * An app-only access token for Graph. Any failure here sends no mail, so it is
 * a refusal whatever the cause.
 */
export async function requestToken(
  config: WithdrawalMailConfig,
): Promise<TokenResult> {
  const url = new URL(
    `https://${TOKEN_HOST}/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
  );
  let response: Response;
  try {
    response = await graphFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: `https://${GRAPH_HOST}/.default`,
        grant_type: "client_credentials",
      }),
    });
  } catch (error) {
    if (error instanceof DisallowedHostError) throw error;
    return { ok: false, failure: { step: "token", cause: cause(error) } };
  }
  if (!response.ok) {
    return { ok: false, failure: { step: "token", status: response.status } };
  }
  try {
    const { access_token: token } = (await response.json()) as {
      access_token?: unknown;
    };
    if (typeof token === "string" && token !== "") return { ok: true, token };
  } catch {
    // Falls through: an answer without a token.
  }
  return {
    ok: false,
    failure: { step: "token", status: response.status, cause: "unreadable" },
  };
}

export type SendResult =
  { state: "sent" } | { state: "refused" | "unknown"; failure: GraphFailure };

/** Send one plain-text message from `config.mailbox` to `to`, kept in Sent Items. */
export async function sendMail(
  config: WithdrawalMailConfig,
  token: string,
  step: "acknowledgement" | "notice",
  to: string,
  message: WithdrawalMessage,
): Promise<SendResult> {
  const url = new URL(
    `https://${GRAPH_HOST}/v1.0/users/${encodeURIComponent(config.mailbox)}/sendMail`,
  );
  let response: Response;
  try {
    response = await graphFetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: message.subject,
          body: { contentType: "Text", content: message.body },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      }),
    });
  } catch (error) {
    if (error instanceof DisallowedHostError) throw error;
    return { state: "unknown", failure: { step, cause: cause(error) } };
  }
  // The body is never read: release the connection.
  await response.body?.cancel().catch(() => {});
  // Graph answers a queued message with 202 and nothing else.
  if (response.status === 202) return { state: "sent" };
  const failure = { step, status: response.status };
  return response.status >= 400 && response.status < 500
    ? { state: "refused", failure }
    : { state: "unknown", failure };
}
