import { Card } from "@skillsite/ui/primitives/card";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import { pricingPage } from "@/content/pricing";

/** The two cards under the price panel on /preise: cancellation terms and payment. */
export function ConditionCards() {
  return (
    <CardGrid columns="md-2">
      {pricingPage.conditionCards.map((card, index) => (
        <Reveal key={card.title} variant="rise-soft" index={index}>
          <Card className="h-full p-7">
            <Heading as="h2" size="h4" className="mb-4">
              {card.title}
            </Heading>
            <div className="flex flex-col gap-3">
              {card.items.map((item) => (
                <Text key={item.text} tone="muted">
                  {item.strong ? (
                    <strong className="text-ink">{item.strong} </strong>
                  ) : null}
                  {item.text}
                </Text>
              ))}
            </div>
          </Card>
        </Reveal>
      ))}
    </CardGrid>
  );
}
