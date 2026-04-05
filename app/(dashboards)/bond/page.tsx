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
import { getBondSubscription } from "@/lib/data/dashboard";

export default async function BondDashboardPage() {
  const session = await getAuthSession();
  if (!session || (session.role !== "BOND" && session.role !== "ADMIN")) {
    redirect("/");
  }

  const subs = await getBondSubscription(session);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bond originator workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Subscription and pipeline context for bond desks. Extend with
          application records as the product grows.
        </p>
      </header>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Subscriptions</CardTitle>
          <CardDescription>
            Paystack integration hooks live on the subscription model; this view
            surfaces tier and billing state.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subscription row yet. Run Prisma migrations and create a
              subscription for your user, or sync billing from Paystack webhooks.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/80">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {session.role === "ADMIN" ? (
                      <th className="px-3 py-2 font-medium">User</th>
                    ) : null}
                    <th className="px-3 py-2 font-medium">Tier</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Renews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/80">
                  {subs.map((s) => (
                    <tr key={s.id} className="bg-background">
                      {session.role === "ADMIN" ? (
                        <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                          {s.userId.slice(0, 8)}…
                        </td>
                      ) : null}
                      <td className="px-3 py-3">
                        <Badge variant="outline">{s.tier}</Badge>
                      </td>
                      <td className="px-3 py-3">{s.status}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {s.currentPeriodEnd
                          ? s.currentPeriodEnd.toLocaleDateString()
                          : "—"}
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
