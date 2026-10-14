import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { Eyebrow } from "@skillsite/ui/eyebrow";
import { Reveal } from "@skillsite/ui/reveal";
import { Heading, Text } from "@skillsite/ui/typography";
import { Booker } from "@/components/booking/booker";
import { WhatsappQr } from "@/components/sections/whatsapp-qr";
import { CtaSection } from "@/components/sections/cta-section";
import { contactDetails } from "@/content/contact";
import { subjects } from "@/content/subjects";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { trustLine } from "@/content/site";
import { ArrowRight } from "lucide-react";

export const metadata = pageMetadata({
  canonical: "/kontakt",
  title: "Kontakt",
  description:
    "Schreib mir per WhatsApp oder E-Mail. Meistens antworte ich noch am selben Tag. Das kostenlose Erstgespräch kannst du direkt buchen.",
});

const sideCardClass =
  "flex flex-1 flex-col justify-center rounded-2xl border border-line bg-surface p-6 shadow-card lift [--lift:-0.25rem] hover:border-coral";
const sideLabelClass = "text-eyebrow uppercase text-coral";

type ContactPageProps = {
  searchParams?: Promise<{
    fach?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const requestedSubject = firstSearchParam(params?.fach);
  const initialSubject = subjects.find(
    (subject) => subject.anchorId === requestedSubject,
  )?.name;
  const whatsapp = contactDetails.whatsapp.href;
  const email = contactDetails.eMail.content;

  return (
    <>
      <PageHeader
        eyebrow="Kontakt"
        title="Schreib mir einfach."
        lead={`Eine kurze Nachricht reicht – meistens antworte ich noch am selben Tag. ${trustLine}`}
      />

      <Container className="py-section-sm">
        <div className="grid items-stretch gap-5 lg:grid-cols-[1.25fr_1fr]">
          <Reveal variant="rise-soft" index={0}>
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="flex h-full flex-col justify-center overflow-hidden rounded-2xl bg-coral-gradient p-[clamp(1.75rem,3.5vw,2.5rem)] text-white shadow-[0_22px_44px_-22px_var(--coral)] lift [--lift:-0.25rem]"
            >
              <span className="text-eyebrow uppercase text-white/90">
                Am liebsten per WhatsApp
              </span>
              <Heading size="h3" className="mt-2.5 mb-1.5">
                Schreib mir auf WhatsApp.
              </Heading>
              <Text
                size="lead"
                tone="inherit"
                className="max-w-[24em] text-white/90"
              >
                Über WhatsApp erreichst du mich am schnellsten. Meistens
                antworte ich noch am selben Tag.
              </Text>
              <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/35 bg-white/20 px-5 py-2.5 font-semibold">
                Jetzt anschreiben <ArrowRight className="size-4" />
              </span>
              <div className="mt-7 hidden items-center gap-4 sm:flex">
                <WhatsappQr value={whatsapp} />
                <Text
                  size="small"
                  tone="inherit"
                  className="max-w-[12em] text-white/85"
                >
                  Oder den QR-Code mit dem Handy scannen.
                </Text>
              </div>
            </a>
          </Reveal>

          <Reveal variant="rise-soft" index={1} className="flex flex-col gap-5">
            <a href={`mailto:${email}`} className={sideCardClass}>
              <span className={sideLabelClass}>E-Mail</span>
              <Heading
                as="h2"
                size="title"
                className="mt-2 mb-1 wrap-break-word"
              >
                {email}
              </Heading>
              <Text size="small" tone="muted">
                Du möchtest dein Anliegen ausführlicher schildern? Schreib mir
                gern eine E-Mail.
              </Text>
            </a>
            <Link href={routes.onlineLearning} className={sideCardClass}>
              <span className={sideLabelClass}>
                Discord und Microsoft Teams
              </span>
              <Heading as="h2" size="title" className="mt-2 mb-1">
                Unser Klassenzimmer
              </Heading>
              <Text
                size="small"
                tone="muted"
                className="inline-flex items-center gap-1.5"
              >
                Unterricht, Materialien und kurze Fragen. Mehr erfahren{" "}
                <ArrowRight className="size-4" />
              </Text>
            </Link>
          </Reveal>
        </div>
      </Container>

      <Section id="kennenlernen" surface>
        <Reveal
          variant="rise-soft"
          className="mx-auto mb-[clamp(1.75rem,4vw,2.5rem)] max-w-[40em] text-center"
        >
          <div className="flex justify-center">
            <Eyebrow>Erstgespräch</Eyebrow>
          </div>
          <Heading size="h3" className="mt-4 mb-3.5">
            Lernen wir uns kennen.
          </Heading>
          <Text tone="muted">
            Such dir einen freien Termin aus. Im kostenlosen, telefonischen
            Erstgespräch klären wir Situation, Fach und Ziel – ganz
            unverbindlich. Eltern sind herzlich willkommen.
          </Text>
        </Reveal>
        <Booker
          event="kennenlernen"
          title="Kostenloses Erstgespräch"
          subtitle="Kostenlos und unverbindlich – ich rufe dich an."
          initialSubject={initialSubject}
        />
      </Section>

      <CtaSection />
    </>
  );
}
