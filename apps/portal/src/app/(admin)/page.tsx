import type { Metadata } from "next";

import { PageHeader } from "@skillsite/ui/layout/page-header";
import { adminHome } from "@/content/admin";
import { LogoutButton } from "@/modules/auth";
import { requireAdminSession } from "@/modules/auth/server";

export const metadata: Metadata = adminHome.metadata;

/** The admin area's start page: who is logged in, and the logout. The modules join it later (admin helper spec). */
export default async function AdminHome() {
  await requireAdminSession();
  return (
    <PageHeader
      eyebrow={adminHome.eyebrow}
      title={adminHome.title}
      lead={adminHome.lead}
    >
      <LogoutButton />
    </PageHeader>
  );
}
