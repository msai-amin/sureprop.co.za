import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent users</CardTitle>
          <CardDescription>
            Latest profiles synced from Supabase via{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /api/auth/sync-user
            </code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users in database.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/80">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">Verification</th>
                    <th className="px-3 py-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {overview.recentUsers.map((u) => (
                    <tr key={u.id} className="bg-background">
                      <td className="px-3 py-3">{u.email}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {u.fullName ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="secondary">{u.role}</Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {u.verificationStatus}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                        {u.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
