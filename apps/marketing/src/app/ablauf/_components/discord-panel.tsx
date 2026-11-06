import Link from "next/link";

import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { CheckList } from "@skillsite/ui/primitives/check-list";
import { Pill } from "@skillsite/ui/primitives/pill";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { discordHighlights, discordPanel } from "@/content/process";
import { routes } from "@/lib/routes";
import { ArrowRight } from "lucide-react";

/** The navy "classroom" panel on /ablauf: the platforms and how a lesson runs there. */
export function DiscordPanel() {
  return (
    <Card
      id="discord"
      tone="inverse"
      radius="3xl"
      className="p-panel text-on-navy"
    >
      <Eyebrow dot={false} tone="inverse-accent">
        {discordPanel.eyebrow}
      </Eyebrow>
      <Heading as="h3" size="h4" className="mt-3.5 mb-2.5 text-white">
        {discordPanel.title}
      </Heading>
      <Text tone="inverse-soft" className="mb-4">
        {discordPanel.text}
      </Text>
      <div className="mb-5 flex flex-wrap gap-2">
        {discordPanel.platforms.map((platform) => (
          <Pill key={platform} tone="inverse" size="sm">
            {platform}
          </Pill>
        ))}
      </div>
      <CheckList items={discordHighlights} size="sm" tone="inverse" />
      <Button asChild variant="inverse" className="mt-6">
        <Link href={routes.onlineLearning}>
          {/* Label and space in one text node: split, the label can shape wider. */}
          {`${discordPanel.setupLink} `}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </Card>
  );
}
