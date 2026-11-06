import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { SmartLink, TextLink } from "@skillsite/ui/primitives/link";
import { Text } from "@skillsite/ui/typography/text";
import { contactDetails } from "@/content/contact";
import { paymentPage } from "@/content/status";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { buildPaypalUrl, parsePaymentRequest } from "@/modules/payment";
import { describeLink, logPayment } from "@/modules/payment/server";

export const metadata: Metadata = pageMetadata({
  ...paymentPage.metadata,
  unlisted: true,
});

// The answer depends entirely on the query and every call has to leave its own
// log line, so this page is never served from a cache.
export const dynamic = "force-dynamic";

type PaymentSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

/**
 * The payment link printed on our invoices: `/zahlung?re=RE-1840&betrag=90,00 EUR`
 * sends the customer straight to PayPal's checkout with amount and invoice
 * number prefilled. An unusable link ends here with a way to reach us instead.
 */
export default async function PaymentPage({
  searchParams,
}: {
  searchParams: PaymentSearchParams;
}) {
  const params = await searchParams;
  const request = parsePaymentRequest(params);

  if (request.ok) {
    logPayment("redirected", {
      invoice: request.invoice,
      amount: request.amount,
    });
    redirect(buildPaypalUrl(request));
  }

  logPayment("rejected", { reason: request.reason, ...describeLink(params) });

  return (
    <StatusPage
      eyebrow={paymentPage.eyebrow}
      title={paymentPage.title}
      lead={paymentPage.lead}
      actions={
        <>
          <Button asChild variant="primary" size="lg">
            <SmartLink href={contactDetails.eMail.href}>
              {paymentPage.actions.eMail}
            </SmartLink>
          </Button>
          <Button asChild variant="outline" size="lg">
            {/* Same tab on purpose: intended by the maintainer; `SmartLink` would open a new tab */}
            <a href={contactDetails.whatsapp.href}>
              {paymentPage.actions.whatsapp}
            </a>
          </Button>
        </>
      }
    >
      <Text size="small" tone="muted" className="mt-6">
        {contactDetails.eMail.content} · {contactDetails.whatsapp.content}
      </Text>
      <Text size="small" tone="muted" className="mt-2">
        <TextLink variant="underline" href={routes.contact}>
          {paymentPage.allContacts}
        </TextLink>
      </Text>
    </StatusPage>
  );
}
