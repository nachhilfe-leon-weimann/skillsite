import Image from "next/image";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { Tag } from "@skillsite/ui/tag";
import { LinkButton } from "@skillsite/ui/button";
import { Reveal } from "@skillsite/ui/reveal";
import { Heading, Text } from "@skillsite/ui/typography";
import { SubjectCards } from "@/components/sections/subject-cards";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { subjects } from "@/content/subjects";
import { subjectsFaq } from "@/content/faqs";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { ArrowRight } from "lucide-react";

export const metadata = pageMetadata({
  canonical: "/faecher",
  title: "Fächer",
  description:
    "Online-Nachhilfe in Mathematik, Informatik und Physik – verständlich erklärt und zum Festpreis von 30 € pro 60 Minuten.",
});

export default function SubjectsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fächer"
        title="Mathe, Informatik und Physik – aus einer Hand."
        titleClassName="max-w-[14em]"
        lead={
          <>
            In allen drei Fächern geht es darum, Zusammenhänge zu verstehen und
            sicher anzuwenden. Der Festpreis beträgt jeweils 30&nbsp;€ pro
            60&nbsp;Minuten.
          </>
        }
      />

      <Container>
        <SubjectCards />
      </Container>

      {subjects.map((subject, index) => {
        const Icon = subject.glyph;
        return (
          <Section
            key={subject.key}
            id={subject.anchorId}
            surface={index % 2 === 1}
          >
            <div className="grid items-start gap-[clamp(1.75rem,4vw,3.5rem)] lg:grid-cols-[0.9fr_1.1fr]">
              <Reveal variant="rise-soft">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-13 items-center justify-center rounded-xl bg-surface-2 font-heading text-[1.4rem] font-bold text-coral">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <Heading size="h3">{subject.name}</Heading>
                    <Tag className="mt-2">30 € · 60 Min.</Tag>
                  </div>
                </div>
                <Text size="lead" tone="muted" className="mt-6">
                  {subject.description}
                </Text>
                <LinkButton
                  href={`${routes.contact}?fach=${subject.anchorId}#kennenlernen`}
                  variant="navy"
                  className="mt-6"
                >
                  Erstgespräch: {subject.name} <ArrowRight className="size-4" />
                </LinkButton>
              </Reveal>

              <div className="grid gap-4 sm:grid-cols-2">
                {subject.topics.map((topic, i) => (
                  <Reveal
                    key={topic.title}
                    variant="rise-soft"
                    index={i}
                    className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
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
              </div>
            </div>
          </Section>
        );
      })}

      <FaqSection
        id="faq"
        title="Häufige Fragen zu den Fächern"
        items={subjectsFaq}
      />
      <CtaSection />
    </>
  );
}
