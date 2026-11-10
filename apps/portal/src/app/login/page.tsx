import type { Metadata } from "next";
import { connection } from "next/server";

import { PageHeader } from "@skillsite/ui/layout/page-header";
import { Text } from "@skillsite/ui/typography/text";
import { loginForm, loginPage } from "@/content/login";
import { authConfigured, LoginForm } from "@/modules/auth/server";

export const metadata: Metadata = loginPage.metadata;

/** The login. Without the SkillForge variables it says the portal is not configured instead of showing the form. */
export default async function LoginPage() {
  // The configuration is read at request time, never baked in by the build.
  await connection();
  return (
    <PageHeader
      eyebrow={loginPage.eyebrow}
      title={loginPage.title}
      lead={loginPage.lead}
    >
      {authConfigured() ? (
        <LoginForm />
      ) : (
        <Text role="status" className="mt-8 max-w-measure-34">
          {loginForm.failures.not_configured}
        </Text>
      )}
    </PageHeader>
  );
}
