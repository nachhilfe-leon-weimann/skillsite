import { requireAdminSession } from "@/modules/auth/server";

/**
 * The admin area: only a live admin session gets in (AH-9); without one the request lands on `/login`. Layouts do
 * not re-render on client navigation, so every page and server function under it checks the session itself too.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdminSession();
  return children;
}
