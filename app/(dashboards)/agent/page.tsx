import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AgentLeadsTable } from "@/components/dashboard/agent-leads-table";
import { PropertyCreateForm } from "@/components/dashboard/property-create-form";
import { getAuthSession } from "@/lib/auth/session";
import { getAgentLeads, getAgentProperties } from "@/lib/data/dashboard";

function formatLocationJson(loc: unknown): string {
  if (loc && typeof loc === "object") {
    const o = loc as Record<string, unknown>;
    const parts = [o.city, o.province, o.country].filter(
      (x): x is string => typeof x === "string" && x.length > 0,
    );
    if (parts.length) return parts.join(", ");
  }
  return "—";
}

export default async function AgentDashboardPage() {
  const session = await getAuthSession();
  if (!session || (session.role !== "AGENT" && session.role !== "ADMIN")) {
    redirect("/");
  }

  const [properties, leads] = await Promise.all([
    getAgentProperties(session),
    getAgentLeads(session),
  ]);

  const leadRows = leads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Agent workspace</h1>
        <p className="text-sm text-muted-foreground">
          Manage property listings and buyer leads. Scope:{" "}
          {session.role === "ADMIN" ? "all agents (admin)" : "your portfolio"}.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <PropertyCreateForm />
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Listings</CardTitle>
            <CardDescription>
              Active inventory buyers can discover and submit leads against.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No properties yet. Add your first listing on the left.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/80">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Title</th>
                      <th className="px-3 py-2 font-medium">Location</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/80">
                    {properties.map((p) => (
                      <tr key={p.id} className="bg-background">
                        <td className="px-3 py-3 font-medium">{p.title}</td>
                        <td className="max-w-[200px] px-3 py-3 text-muted-foreground">
                          {formatLocationJson(p.location)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                          R{" "}
                          {Number(p.price).toLocaleString("en-ZA", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline">{p.status}</Badge>
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

      <AgentLeadsTable leads={leadRows} />
    </div>
  );
}
