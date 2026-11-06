import Link from "next/link";

import { Container } from "@skillsite/ui/layout/container";
import { Split } from "@skillsite/ui/layout/split";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Heading } from "@skillsite/ui/typography/heading";
import { Lead } from "@skillsite/ui/typography/lead";
import { Text } from "@skillsite/ui/typography/text";
import { ProfilePhoto } from "@/components/sections/profile-photo";
import { homeHero } from "@/content/home";
import { primaryCta, trustLine } from "@/content/site";
import { routes } from "@/lib/routes";
import { ArrowRight, Check } from "lucide-react";

/**
 * The home page's hero: the headline with its drawn underline, the calls to
 * action, and the photo with the price badge and the navy tag floating on it.
 */
export function Hero() {
  const { title, priceBadge } = homeHero;
  return (
    <Container className="pt-hero-top pb-hero-bottom">
      <Split gap="split-hero" ratio="1.15/0.85">
        <div>
          <Reveal trigger="mount" variant="rise-soft" index={0}>
            <Eyebrow>{homeHero.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal
            trigger="mount"
            variant="rise-soft"
            index={1}
            className="mt-4"
          >
            <Heading as="h1" size="display">
              {title.before}{" "}
              <span className="relative whitespace-nowrap text-coral">
                {title.highlight}
                <svg
                  viewBox="0 0 200 22"
                  preserveAspectRatio="none"
                  aria-hidden
                  className="absolute left-[-2%] bottom-[-0.16em] h-[0.42em] w-[104%] overflow-visible"
                >
                  <path
                    d="M4 14 C 46 5, 150 4, 196 12"
                    pathLength={1}
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    className="[stroke-dasharray:1] motion-safe:animate-draw"
                  />
                </svg>
              </span>{" "}
              {title.after}
            </Heading>
          </Reveal>
          <Reveal
            trigger="mount"
            variant="rise-soft"
            index={2}
            className="mt-6"
          >
            <Lead className="max-w-measure-30">{homeHero.lead}</Lead>
          </Reveal>
          <Reveal
            trigger="mount"
            variant="rise-soft"
            index={3}
            className="mt-8 flex flex-wrap gap-3.5"
          >
            <Button asChild variant="primary" size="lg">
              <Link href={primaryCta.href}>
                {primaryCta.label} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={routes.subjects}>{homeHero.subjectsLink}</Link>
            </Button>
          </Reveal>
          <Reveal
            trigger="mount"
            variant="rise-soft"
            index={4}
            className="mt-4"
          >
            <Text size="small" tone="muted">
              {trustLine}
            </Text>
          </Reveal>
        </div>

        <div className="relative">
          <Reveal trigger="mount" variant="settle" delay={200}>
            <ProfilePhoto aspect="4/5" />
          </Reveal>
          <Reveal
            trigger="mount"
            variant="fade"
            delay={480}
            as={Card}
            className="absolute -left-4 bottom-8 flex items-center gap-3 px-4 py-3.5"
          >
            <span className="font-heading text-price-badge font-extrabold text-coral">
              {priceBadge.amount}
            </span>
            <Text size="caption" tone="muted" className="leading-tight">
              {priceBadge.unit}
              <br />
              {priceBadge.scope}
            </Text>
          </Reveal>
          <Reveal
            trigger="mount"
            variant="fade"
            delay={580}
            as={Card}
            tone="inverse"
            radius="callout"
            className="absolute -right-3.5 top-6 flex flex-row gap-2 items-center px-4 py-2.5 text-callout font-semibold text-white"
          >
            {/* Label and space in one text node: split, the label can shape wider. */}
            {`${homeHero.tag} `}
            <Check className="size-4" />
          </Reveal>
        </div>
      </Split>
    </Container>
  );
}
