import Link from "next/link";
import Image from "next/image";

import { Section } from "@skillsite/ui/layout/section";
import { Split } from "@skillsite/ui/layout/split";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Tag } from "@skillsite/ui/primitives/tag";
import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { IconBadge } from "@skillsite/ui/primitives/icon-badge";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { subjectsPage, type Subject } from "@/content/subjects";
import { routes } from "@/lib/routes";
import { ArrowRight } from "lucide-react";

/**
 * One subject's section on /faecher: its glyph, price tag, description and
 * first-meeting button beside a grid of topic cards. `surface` tints every
 * other section.
 */
export function SubjectDetail({
  subject,
  surface,
}: {
  subject: Subject;
  surface: boolean;
}) {
  const Icon = subject.glyph;
  const { detail } = subjectsPage;
  return (
    <Section id={subject.anchorId} surface={surface}>
      <Split align="start" ratio="0.9/1.1">
        <Reveal variant="rise-soft">
          <div className="flex items-center gap-3.5">
            <IconBadge
              size="13"
              tone="subtle"
              className="font-heading text-icon-badge font-bold"
            >
              <Icon className="size-6" />
            </IconBadge>
            <div>
              <Heading size="h3">{subject.name}</Heading>
              <Tag className="mt-2">{detail.priceTag}</Tag>
            </div>
          </div>
          <Text size="lead" tone="muted" className="mt-6">
            {subject.description}
          </Text>
          <Button asChild variant="secondary" className="mt-6">
            <Link
              href={`${routes.contact}?fach=${subject.anchorId}#kennenlernen`}
            >
              {/* Label and space in one text node: split, it shapes a hair wider. */}
              {`${detail.firstMeeting} `}
              {subject.name} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>

        <CardGrid gap="4" columns="sm-2">
          {subject.topics.map((topic, i) => (
            <Reveal
              key={topic.title}
              variant="rise-soft"
              index={i}
              as={Card}
              className="overflow-hidden"
            >
              <div className="relative aspect-video border-b border-line">
                <Image
                  src={topic.image}
                  alt={topic.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <Heading as="h3" size="title">
                  {topic.title}
                </Heading>
                <Text size="small" tone="muted" className="mt-1">
                  {topic.description}
                </Text>
              </div>
            </Reveal>
          ))}
        </CardGrid>
      </Split>
    </Section>
  );
}
