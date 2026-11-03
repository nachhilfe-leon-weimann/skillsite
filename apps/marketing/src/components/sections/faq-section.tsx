import {
  Accordion,
  type AccordionEntry,
} from "@skillsite/ui/primitives/accordion";
import { Container } from "@skillsite/ui/layout/container";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";

type FaqSectionProps = {
  title?: string;
  items: AccordionEntry[];
  id?: string;
};

export function FaqSection({
  title = "Häufige Fragen",
  items,
  id,
}: FaqSectionProps) {
  return (
    <section id={id}>
      <Container size="faq" className="py-section">
        <Reveal variant="rise-soft" index={0}>
          <Heading size="h3" className="mb-7 text-center">
            {title}
          </Heading>
        </Reveal>
        <Reveal variant="rise-soft" index={1}>
          <Accordion items={items} />
        </Reveal>
      </Container>
    </section>
  );
}
