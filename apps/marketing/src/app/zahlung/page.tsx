import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { paymentPage } from "@/content/status";
import { pageMetadata } from "@/lib/metadata";
import {
  buildPaypalUrl,
  parseInvoiceNumber,
  toPageState,
  type PaymentPageState,
} from "@/modules/payment";
import {
  describeLink,
  logPayment,
  lookupInvoice,
} from "@/modules/payment/server";

import { InvoiceForm } from "./_components/invoice-form";
import { PaymentStatus } from "./_components/payment-status";

export const metadata: Metadata = pageMetadata({
  ...paymentPage.metadata,
  unlisted: true,
});

// The answer depends entirely on the query and every lookup has to run fresh
// and leave its own log line, so this page is never served from a cache.
export const dynamic = "force-dynamic";

type PaymentSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

/** A state that ends on this page instead of at PayPal. */
type StatusState = Exclude<PaymentPageState, { kind: "redirect" }>;

/**
 * The payment link printed on our invoices: `/zahlung?re=RE-1840` looks the
 * invoice up in SkillForge and sends the customer to PayPal's checkout with the
 * open amount SkillForge confirmed. `betrag` in an older link is ignored.
 * Without a number the page asks for one; every other answer ends on a status
 * page with a way to reach us - never at PayPal without a fresh lookup.
 */
export default async function PaymentPage({
  searchParams,
}: {
  searchParams: PaymentSearchParams;
}) {
  const params = await searchParams;
  const parsed = parseInvoiceNumber(params.re);

  if (!parsed.ok) {
    // No number yet is not a payment request: the field, and no log line.
    if (parsed.reason === "missing") {
      return (
        <StatusPage
          eyebrow={paymentPage.eyebrow}
          title={paymentPage.form.title}
          lead={paymentPage.form.lead}
          actions={<InvoiceForm />}
        />
      );
    }
    logPayment("rejected", { reason: parsed.reason, ...describeLink(params) });
    return <PaymentStatus {...paymentPage.malformed} />;
  }

  const state = toPageState(
    parsed.invoice,
    await lookupInvoice(parsed.invoice),
  );

  if (state.kind === "redirect") {
    const { invoice, amount } = state.request;
    // `redirect` throws to end the render: the line has to come first.
    logPayment("redirected", { invoice, amount });
    redirect(buildPaypalUrl(state.request));
  }

  logPayment(state.kind, { invoice: state.invoice });
  return <StateStatus state={state} />;
}

function StateStatus({ state }: { state: StatusState }) {
  switch (state.kind) {
    case "blocked":
      return (
        <PaymentStatus
          title={paymentPage.blocked.title}
          lead={paymentPage.blocked.lead(state.invoice)}
        />
      );
    case "paid":
      return <PaymentStatus {...paymentPage.paid} />;
    case "not_payable":
      return (
        <PaymentStatus {...paymentPage.notPayable} form={<InvoiceForm />} />
      );
    case "unavailable":
      return <PaymentStatus {...paymentPage.unavailable} />;
  }
}
