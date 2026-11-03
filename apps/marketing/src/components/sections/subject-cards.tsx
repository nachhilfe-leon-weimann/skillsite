import Link from "next/link";

import { Reveal } from "@skillsite/ui/motion/reveal";
import { Tag } from "@skillsite/ui/primitives/tag";
import { Card } from "@skillsite/ui/primitives/card";
import { Heading } from "@skillsite/ui/typography/heading";
import { CardGrid } from "@skillsite/ui/layout/card-grid";
import { subjects } from "@/content/subjects";
import { ArrowRight } from "lucide-react";

type HeadingLevel = "h2" | "h3";

/**
 * Three subject teaser cards. `headingAs` is the level of the card titles: h3
 * under a section heading (home), h2 where they follow the page's h1 directly
 * (/faecher). The look does not change with the level.
 */
export function SubjectCards({
  headingAs = "h3",
}: {
  headingAs?: HeadingLevel;
}) {
  return (
    <CardGrid columns="sm-2-lg-3">
      {subjects.map((subject, i) => (
        <Reveal key={subject.key} variant="rise-soft" index={i}>
          <SubjectCard subject={subject} headingAs={headingAs} />
        </Reveal>
      ))}
    </CardGrid>
  );
}

function SubjectCard({
  subject,
  headingAs,
}: {
  subject: (typeof subjects)[number];
  headingAs: HeadingLevel;
}) {
  const Icon = subject.glyph;
  return (
    <Card asChild lift="md" className="group flex h-full flex-col p-6">
      <Link href={subject.href}>
        <div className="flex items-center justify-between">
          <span className="flex size-13 items-center justify-center rounded-xl bg-surface-2 font-heading text-icon-badge font-bold text-coral">
            <Icon className="size-6" />
          </span>
          {subject.tag ? <Tag>{subject.tag}</Tag> : null}
        </div>
        <Heading
          as={headingAs}
          size="card-title"
          wrap="normal"
          tone="default"
          className="mt-5"
        >
          {subject.name}
        </Heading>
        <p className="mt-2 flex-1 text-ink-soft">{subject.claim}</p>
        <span className="mt-4 text-card-link font-semibold text-ink flex flex-row items-center gap-1">
          Mehr erfahren <ArrowRight className="size-4" />
        </span>
      </Link>
    </Card>
  );
}
