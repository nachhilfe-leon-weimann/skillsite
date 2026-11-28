import { StatusPage } from "@skillsite/ui/layout/status-page";
import { Button } from "@skillsite/ui/primitives/button";
import { SmartLink, TextLink } from "@skillsite/ui/primitives/link";
import { Text } from "@skillsite/ui/typography/text";

import { contactDetails } from "@/content/contact";
import { paymentPage } from "@/content/status";
import { routes } from "@/lib/routes";

type PaymentStatusProps = {
  title: string;
  lead?: string;
  /** The field again, on its own line before the contact buttons. */
  form?: React.ReactNode;
};

/** A status of /zahlung that does not redirect: what happened, then the ways to reach the maintainer. */
export function PaymentStatus({ title, lead, form }: PaymentStatusProps) {
  return (
    <StatusPage
      eyebrow={paymentPage.eyebrow}
      title={title}
      lead={lead}
      actions={
        <>
          {/* Full width in the wrapping row, so the buttons start a line below it. */}
          {form ? (
            <div className="flex w-full justify-center">{form}</div>
          ) : null}
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
