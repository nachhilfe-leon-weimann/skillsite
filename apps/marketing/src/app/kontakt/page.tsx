import Link from "next/link";

import { Container } from "@skillsite/ui/layout/container";
import { Section } from "@skillsite/ui/layout/section";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Card } from "@skillsite/ui/primitives/card";
import { SmartLink } from "@skillsite/ui/primitives/link";
import { Pill } from "@skillsite/ui/primitives/pill";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { Split } from "@skillsite/ui/layout/split";
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

const sideCardClass = "flex flex-1 flex-col justify-center p-6";

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
        <Split align="stretch" gap="5" ratio="1.25/1">
          <Reveal variant="rise-soft" index={0}>
            <Card
              asChild
              tone="accent"
              lift="sm"
              className="flex h-full flex-col justify-center overflow-hidden p-panel-contact shadow-glow-md"
            >
              <SmartLink href={whatsapp}>
                <Eyebrow dot={false} tone="on-accent">
                  Am liebsten per WhatsApp
                </Eyebrow>
                <Heading size="h3" className="mt-2.5 mb-1.5">
                  Schreib mir auf WhatsApp.
                </Heading>
                <Text
                  size="lead"
                  tone="inherit"
                  className="max-w-measure-24 text-on-accent-90"
                >
                  Über WhatsApp erreichst du mich am schnellsten. Meistens
                  antworte ich noch am selben Tag.
                </Text>
                <Pill
                  tone="on-accent"
                  size="md"
                  className="mt-6 inline-flex w-fit items-center gap-2"
                >
                  Jetzt anschreiben <ArrowRight className="size-4" />
                </Pill>
                <div className="mt-7 hidden items-center gap-4 sm:flex">
                  <WhatsappQr value={whatsapp} />
                  <Text
                    size="small"
                    tone="inherit"
                    className="max-w-measure-12 text-on-accent-85"
                  >
                    Oder den QR-Code mit dem Handy scannen.
                  </Text>
                </div>
              </SmartLink>
            </Card>
          </Reveal>

          <Reveal variant="rise-soft" index={1} className="flex flex-col gap-5">
            <Card asChild lift="sm" className={sideCardClass}>
              <a href={`mailto:${email}`}>
                <Eyebrow dot={false}>E-Mail</Eyebrow>
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
            </Card>
            <Card asChild lift="sm" className={sideCardClass}>
              <Link href={routes.onlineLearning}>
                <Eyebrow dot={false}>Discord und Microsoft Teams</Eyebrow>
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
            </Card>
          </Reveal>
        </Split>
      </Container>

      <Section id="kennenlernen" surface>
        <Reveal
          variant="rise-soft"
          className="mx-auto mb-intro-bottom max-w-measure-40 text-center"
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
