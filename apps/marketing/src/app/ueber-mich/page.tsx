import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Button } from "@skillsite/ui/primitives/button";
import { Heading } from "@skillsite/ui/typography/heading";
import { Lead } from "@skillsite/ui/typography/lead";
import { Text } from "@skillsite/ui/typography/text";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { StatGrid } from "@/components/sections/stat-grid";
import { ProfilePhoto } from "@/components/sections/profile-photo";
import { CodeTypewriter } from "@/components/sections/code-typewriter";
import { CtaSection } from "@/components/sections/cta-section";
import {
  aboutIntro,
  aboutStats,
  aboutQuote,
  principles,
  software,
} from "@/content/about";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { ArrowRight } from "lucide-react";

export const metadata = pageMetadata({
  canonical: "/ueber-mich",
  title: "Über mich",
  description:
    "Hi, ich bin Leon. Ich gebe Nachhilfe in Mathe, Informatik und Physik – individuell statt nach Schema, auf Augenhöhe und ohne Druck.",
});

export default function AboutPage() {
  return (
    <>
      <Container className="py-[clamp(2.5rem,6vw,4.5rem)]">
        <div className="grid items-center gap-[clamp(2rem,5vw,3.5rem)] lg:grid-cols-2">
          <div>
            <Reveal trigger="mount" variant="rise-soft" index={0}>
              <Eyebrow>Über mich</Eyebrow>
            </Reveal>
            <Reveal
              trigger="mount"
              variant="rise-soft"
              index={1}
              className="mt-4"
            >
              <Heading as="h1" size="h1">
                Hi, ich bin Leon.
              </Heading>
            </Reveal>
            <Reveal
              trigger="mount"
              variant="rise-soft"
              index={2}
              className="mt-5"
            >
              <Lead className="max-w-[30em]">{aboutIntro}</Lead>
            </Reveal>
            <Reveal
              trigger="mount"
              variant="rise-soft"
              index={3}
              className="mt-7"
            >
              <Button asChild variant="primary" size="lg">
                <Link href={routes.firstMeeting}>
                  Finde heraus, ob wir zusammenpassen{" "}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Reveal>
          </div>

          <div className="flex flex-col gap-4">
            <Reveal trigger="mount" variant="settle" delay={200}>
              <ProfilePhoto aspect="5/4" />
            </Reveal>
            <Reveal trigger="mount" variant="rise-soft" delay={350}>
              <StatGrid
                items={aboutStats}
                size="sm"
                className="grid-cols-3"
                animateValue
              />
            </Reveal>
          </div>
        </div>
      </Container>

      <Container className="pb-section-sm">
        <Reveal
          variant="rise-soft"
          className="mx-auto max-w-220 rounded-3xl bg-navy p-[clamp(1.75rem,4vw,2.75rem)] shadow-card"
        >
          <p className="font-heading text-[clamp(1.3rem,2.6vw,1.9rem)] font-medium leading-[1.35] text-white">
            „{aboutQuote}“
          </p>
        </Reveal>
      </Container>

      <Container className="py-section-sm">
        <Reveal variant="rise-soft" className="mb-8">
          <Heading size="h3">Woran ich mich halte</Heading>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-3">
          {principles.map((principle, i) => (
            <Reveal
              key={principle.n}
              variant="rise-soft"
              index={i}
              className="rounded-2xl border border-line bg-surface p-6 shadow-card"
            >
              <span className="font-heading text-[2rem] font-extrabold leading-none text-coral">
                {principle.n}
              </span>
              <Heading as="h3" size="title" className="mt-3 mb-2">
                {principle.title}
              </Heading>
              <Text tone="muted">{principle.text}</Text>
            </Reveal>
          ))}
        </div>
      </Container>

      <Section surface>
        <div className="grid items-center gap-[clamp(1.75rem,4vw,3.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Reveal variant="rise-soft" index={0}>
              <Eyebrow>{software.eyebrow}</Eyebrow>
            </Reveal>
            <Reveal variant="rise-soft" index={1} className="mt-4">
              <Heading size="h3">{software.title}</Heading>
            </Reveal>
            <Reveal variant="rise-soft" index={2} className="mt-4">
              <Text size="lead" tone="muted">
                {software.text}
              </Text>
            </Reveal>
          </div>
          <CodeTypewriter />
        </div>
      </Section>

      <CtaSection />
    </>
  );
}
