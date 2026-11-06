import { Container } from "@skillsite/ui/layout/container";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { ArrowLink } from "@skillsite/ui/primitives/link";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Text } from "@skillsite/ui/typography/text";
import { Booker, bookingToday } from "@/modules/booking";
import { CtaSection } from "@/components/sections/cta-section";
import { bookingPage } from "@/content/booking";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  canonical: "/termin",
  ...bookingPage.metadata,
});

export default function BookingPage() {
  const { header, booker, newcomer } = bookingPage;
  return (
    <>
      <PageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        titleClassName="max-w-measure-14"
        lead={header.lead}
      />

      <Container className="py-section-sm">
        <Booker
          renderedToday={bookingToday()}
          event="nachhilfe"
          title={booker.title}
          subtitle={booker.subtitle}
        />
        <Reveal variant="fade" as="p" className="mt-6">
          <Text as="span" tone="muted">
            {newcomer.text}{" "}
            <ArrowLink href={routes.firstMeeting}>{newcomer.link}</ArrowLink>
          </Text>
        </Reveal>
      </Container>

      <CtaSection />
    </>
  );
}
