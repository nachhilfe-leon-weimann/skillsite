import { Container } from "@skillsite/ui/layout/container";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { TextLink } from "@skillsite/ui/primitives/link";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { withdrawalFallbackEmail, withdrawalPage } from "@/content/withdrawal";
import { pageMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { WithdrawalForm } from "@/modules/withdrawal";

export const metadata = pageMetadata({
  ...withdrawalPage.metadata,
  canonical: routes.withdrawalFunction,
});

/** The electronic withdrawal function (§ 356a BGB), linked from every page's footer. */
export default function WithdrawalPage() {
  const { header, intro } = withdrawalPage;
  return (
    <>
      <PageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        lead={header.lead}
      />

      <Container className="grid gap-10 pb-section lg:grid-cols-2 lg:items-start">
        <div className="flex max-w-measure-34 flex-col gap-4">
          <Heading as="h2" size="h3">
            {intro.title}
          </Heading>
          <Text tone="muted">{intro.steps}</Text>
          <Text tone="muted">{intro.deadline}</Text>
          <Text tone="muted">
            {intro.notice.before}
            <TextLink href={routes.withdrawalNotice}>
              {intro.notice.link}
            </TextLink>
            {intro.notice.after}
          </Text>
          <Text tone="muted">
            {intro.otherWays.before}
            <TextLink href={`mailto:${withdrawalFallbackEmail}`}>
              {withdrawalFallbackEmail}
            </TextLink>
            {intro.otherWays.after}
          </Text>
        </div>
        <WithdrawalForm />
      </Container>
    </>
  );
}
