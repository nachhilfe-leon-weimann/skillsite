import { Container } from "@skillsite/ui/layout/container";
import { PageHeader } from "@skillsite/ui/layout/page-header";
import { SubjectCards } from "@/components/sections/subject-cards";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { subjects, subjectsPage } from "@/content/subjects";
import { subjectsFaq } from "@/content/faqs";
import { pageMetadata } from "@/lib/metadata";
import { SubjectDetail } from "./_components/subject-detail";

export const metadata = pageMetadata({
  canonical: "/faecher",
  ...subjectsPage.metadata,
});

export default function SubjectsPage() {
  const { header } = subjectsPage;
  return (
    <>
      <PageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        titleClassName="max-w-measure-14"
        lead={header.lead}
      />

      <Container>
        <SubjectCards headingAs="h2" />
      </Container>

      {subjects.map((subject, index) => (
        <SubjectDetail
          key={subject.key}
          subject={subject}
          surface={index % 2 === 1}
        />
      ))}

      <FaqSection id="faq" title={subjectsPage.faqTitle} items={subjectsFaq} />
      <CtaSection />
    </>
  );
}
