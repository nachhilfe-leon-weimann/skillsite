import {
  Accordion,
  type AccordionEntry,
} from "@skillsite/ui/primitives/accordion";
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
      <div className="mx-auto max-w-205 px-6 py-section">
        <Reveal variant="rise-soft" index={0}>
          <Heading size="h3" className="mb-7 text-center">
            {title}
          </Heading>
        </Reveal>
        <Reveal variant="rise-soft" index={1}>
          <Accordion items={items} />
        </Reveal>
      </div>
    </section>
  );
}
