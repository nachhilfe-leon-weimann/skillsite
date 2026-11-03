import Link from "next/link";

import { Reveal } from "@skillsite/ui/motion/reveal";
import { Tag } from "@skillsite/ui/primitives/tag";
import { subjects } from "@/content/subjects";
import { ArrowRight } from "lucide-react";

/** Three subject teaser cards */
export function SubjectCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject, i) => (
        <Reveal key={subject.key} variant="rise-soft" index={i}>
          <SubjectCard subject={subject} />
        </Reveal>
      ))}
    </div>
  );
}

function SubjectCard({ subject }: { subject: (typeof subjects)[number] }) {
  const Icon = subject.glyph;
  return (
    <Link
      href={subject.href}
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card lift [--lift:-0.375rem] hover:border-coral"
    >
      <div className="flex items-center justify-between">
        <span className="flex size-13 items-center justify-center rounded-xl bg-surface-2 font-heading text-icon-badge font-bold text-coral">
          <Icon className="size-6" />
        </span>
        {subject.tag ? <Tag>{subject.tag}</Tag> : null}
      </div>
      <h3 className="mt-5 font-heading text-card-title font-bold text-ink">
        {subject.name}
      </h3>
      <p className="mt-2 flex-1 text-ink-soft">{subject.claim}</p>
      <span className="mt-4 text-card-link font-semibold text-ink flex flex-row items-center gap-1">
        Mehr erfahren <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
