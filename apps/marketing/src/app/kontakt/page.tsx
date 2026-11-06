import { Container } from "@skillsite/ui/layout/container";
import { Section } from "@skillsite/ui/layout/section";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { Booker, bookingToday } from "@/modules/booking";
import { CtaSection } from "@/components/sections/cta-section";
import { contactPage } from "@/content/contact";
import { subjects } from "@/content/subjects";
import { pageMetadata } from "@/lib/metadata";
import { ContactCards } from "./_components/contact-cards";

export const metadata = pageMetadata({
  canonical: "/kontakt",
  ...contactPage.metadata,
});

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
  const { header, firstMeeting } = contactPage;

  return (
    <>
      <PageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        lead={header.lead}
      />

      <Container className="py-section-sm">
        <ContactCards />
      </Container>

      <Section id="kennenlernen" surface>
        <Reveal
          variant="rise-soft"
          className="mx-auto mb-intro-bottom max-w-measure-40 text-center"
        >
          <div className="flex justify-center">
            <Eyebrow>{firstMeeting.eyebrow}</Eyebrow>
          </div>
          <Heading size="h3" className="mt-4 mb-3.5">
            {firstMeeting.title}
          </Heading>
          <Text tone="muted">{firstMeeting.text}</Text>
        </Reveal>
        <Booker
          renderedToday={bookingToday()}
          event="kennenlernen"
          title={firstMeeting.booker.title}
          subtitle={firstMeeting.booker.subtitle}
          initialSubject={initialSubject}
        />
      </Section>

      <CtaSection />
    </>
  );
}
