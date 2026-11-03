import { Text } from "./text";

/** Intro paragraph — lead size, muted tone. */
export function Lead({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <Text size="lead" tone="muted" className={className} {...props} />;
}
