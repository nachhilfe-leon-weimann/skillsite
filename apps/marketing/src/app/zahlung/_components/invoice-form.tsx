import { Field, Input } from "@skillsite/ui/forms/field";
import { Button } from "@skillsite/ui/primitives/button";
import { cn } from "@skillsite/ui/utils/cn";

import { paymentPage } from "@/content/status";
import { routes } from "@/lib/routes";

/** One form per page, so a fixed id ties the label to its field. */
const FIELD_ID = "invoice-number";

/**
 * The field for the invoice number. A plain GET form: it works without
 * JavaScript and lands on `/zahlung?re=<number>`, the link the invoice prints.
 */
export function InvoiceForm({ className }: { className?: string }) {
  const { label, placeholder, submit } = paymentPage.form;
  return (
    <form
      method="get"
      action={routes.payment}
      className={cn(
        "flex w-full max-w-measure-24 flex-col gap-3.5 text-left",
        className,
      )}
    >
      <Field label={label} htmlFor={FIELD_ID}>
        <Input
          id={FIELD_ID}
          name="re"
          placeholder={placeholder}
          required
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <Button type="submit" variant="primary" size="lg">
        {submit}
      </Button>
    </form>
  );
}
