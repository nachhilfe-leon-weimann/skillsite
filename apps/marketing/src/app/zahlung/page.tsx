import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { Text } from "@skillsite/ui/typography/text";
import { contactDetails } from "@/content/contact";
import {
  buildPaypalUrl,
  parsePaymentRequest,
} from "@/lib/payment/invoice-link";
import { describeLink, logPayment } from "@/lib/payment/log";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Rechnung bezahlen",
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
      eyebrow="Zahlung"
      title="Dieser Zahlungslink führt nicht weiter."
      lead={
        <>
          Vermutlich ist der Link aus der Rechnung unterwegs abgeschnitten
          worden. Schreib mir kurz mit deiner Rechnungsnummer – du bekommst
          sofort einen neuen Link.
        </>
      }
      actions={
        <>
          <Button asChild variant="primary" size="lg">
            <a href={contactDetails.eMail.href}>E-Mail schreiben</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={contactDetails.whatsapp.href}>Über WhatsApp melden</a>
          </Button>
        </>
      }
    >
      <Text size="small" tone="muted" className="mt-6">
        {contactDetails.eMail.content} · {contactDetails.whatsapp.content}
      </Text>
      <Text size="small" tone="muted" className="mt-2">
        <Link href={routes.contact} className="underline underline-offset-4">
          Alle Kontaktwege
        </Link>
      </Text>
    </StatusPage>
  );
}
