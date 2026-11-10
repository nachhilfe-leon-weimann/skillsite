import type { Metadata } from "next";

import { PageHeader } from "@skillsite/ui/layout/page-header";
import { loginPage } from "@/content/login";

export const metadata: Metadata = loginPage.metadata;

/** The login: a placeholder until the form arrives (admin helper spec, SS3). */
export default function LoginPage() {
  return (
    <PageHeader
      eyebrow={loginPage.eyebrow}
      title={loginPage.title}
      lead={loginPage.lead}
    />
  );
}
