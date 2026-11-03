import { Eyebrow } from "../typography/eyebrow";
import { Heading } from "../typography/heading";
import { Text } from "../typography/text";
import { Container } from "./container";

type StatusPageProps = {
  eyebrow: React.ReactNode;
  /** The page's h1. */
  title: React.ReactNode;
  lead: React.ReactNode;
  /** The buttons below the lead. */
  actions: React.ReactNode;
  /** Lines below the actions. */
  children?: React.ReactNode;
};

/** A page that is only a status message: not found, an error, an unusable link. */
export function StatusPage({
  eyebrow,
  title,
  lead,
  actions,
  children,
}: StatusPageProps) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-section text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading as="h1" size="h1" className="mt-4">
        {title}
      </Heading>
      <Text size="lead" tone="muted" className="mt-4 max-w-measure-34">
        {lead}
      </Text>
      <div className="mt-8 flex flex-wrap justify-center gap-3.5">
        {actions}
      </div>
      {children}
    </Container>
  );
}
