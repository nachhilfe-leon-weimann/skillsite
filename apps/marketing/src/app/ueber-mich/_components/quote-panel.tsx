import { Card } from "@skillsite/ui/primitives/card";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Text } from "@skillsite/ui/typography/text";
import { aboutQuote, quoteMarks } from "@/content/about";

/** The navy quote panel on /ueber-mich. */
export function QuotePanel() {
  return (
    <Reveal
      variant="rise-soft"
      as={Card}
      tone="inverse"
      radius="3xl"
      className="mx-auto max-w-220 p-panel-quote"
    >
      <Text
        tone="inherit"
        className="font-heading text-quote font-medium leading-quote text-white"
      >
        {quoteMarks.open}
        {aboutQuote}
        {quoteMarks.close}
      </Text>
    </Reveal>
  );
}
