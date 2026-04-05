import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminUserRoleTable } from "@/components/dashboard/admin-user-role-table";
import { getAuthSession } from "@/lib/auth/session";
import { getAdminOverview } from "@/lib/data/dashboard";

export default async function AdminDashboardPage() {
  const session = await getAuthSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const overview = await getAdminOverview(session);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Platform admin</h1>
        <p className="text-sm text-muted-foreground">
          High-level counts and recent users. Pair with audit logs for
          operational reviews.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {overview.userCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {overview.propertyCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {overview.leadCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminUserRoleTable
        users={overview.recentUsers.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
