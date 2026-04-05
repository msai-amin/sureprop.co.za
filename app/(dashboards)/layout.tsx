import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublishableConfig } from "@/lib/supabase/env";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/** Dashboards depend on cookies + Supabase; never statically prerender. */
export const dynamic = "force-dynamic";

export default async function DashboardsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  let email: string | null = null;
  if (getSupabasePublishableConfig()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <DashboardShell role={session.role} email={email}>
      <main className="flex-1">{children}</main>
    </DashboardShell>
  );
}
