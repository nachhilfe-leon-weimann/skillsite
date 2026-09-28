import { Container } from "@skillsite/ui/layout/container";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { ArrowLink } from "@skillsite/ui/primitives/link";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Text } from "@skillsite/ui/typography/text";
import { Booker } from "@/components/booking/booker";
import { CtaSection } from "@/components/sections/cta-section";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  canonical: "/termin",
  title: "Termin buchen",
  description:
    "Für bestehende Schüler:innen: freie Termine online buchen und bis 24 Stunden vorher kostenfrei verschieben oder absagen.",
});

export default function BookingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Termin buchen"
        title="Buche deine nächste Nachhilfestunde."
        titleClassName="max-w-measure-14"
        lead="Du bist schon dabei? Wähle deinen nächsten freien Termin direkt im Kalender. Bis 24 Stunden vorher kannst du kostenfrei verschieben oder absagen."
      />

      <Container className="py-section-sm">
        <Booker
          event="nachhilfe"
          title="Nachhilfestunde buchen"
          subtitle="Such dir einen freien Termin aus – wöchentlich oder nach Bedarf."
        />
        <Reveal variant="fade" as="p" className="mt-6">
          <Text as="span" tone="muted">
            Du nimmst noch keine Nachhilfe bei mir?{" "}
            <ArrowLink href={routes.firstMeeting}>
              Starte mit dem kostenlosen Erstgespräch
            </ArrowLink>
          </Text>
        </Reveal>
      </Container>

      <CtaSection />
    </>
  );
}
