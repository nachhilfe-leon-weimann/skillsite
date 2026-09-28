import { cn } from "../utils/cn";

const controlClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-body text-ink transition-[border-color,box-shadow] placeholder:text-ink-soft focus:border-coral focus:outline-none focus:shadow-focus";

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-small font-semibold text-ink"
      >
        {label}
        {hint ? (
          <span className="ml-1 font-normal text-ink-soft">{hint}</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlClass, "resize-y", className)} {...props} />
  );
}
