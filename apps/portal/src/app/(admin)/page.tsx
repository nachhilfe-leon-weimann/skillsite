import type { Metadata } from "next";

import { PageHeader } from "@skillsite/ui/layout/page-header";
import { adminHome } from "@/content/admin";

export const metadata: Metadata = adminHome.metadata;

/** The admin area's start page: a placeholder until the modules arrive (admin helper spec, SS6). */
export default function AdminHome() {
  return (
    <PageHeader
      eyebrow={adminHome.eyebrow}
      title={adminHome.title}
      lead={adminHome.lead}
    />
  );
}
