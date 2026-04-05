"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "VIEWING_SCHEDULED",
  "OFFER_MADE",
  "CLOSED",
] as const;

export type LeadRow = {
  id: string;
  status: (typeof LEAD_STATUSES)[number] | string;
  createdAt: string;
  propertyId: string;
  buyerId: string;
  propertyTitle: string;
};

export function AgentLeadsTable({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(leadId: string, status: string) {
    setError(null);
    setUpdating(leadId);
    const res = await fetch(`/api/v1/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      setError(j.message ?? "Could not update lead.");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Leads</CardTitle>
        <CardDescription>
          Pipeline for your listings. Updates sync to the audit log.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No leads yet. When buyers express interest on an active listing, they
            appear here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/80">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Property</th>
                  <th className="px-3 py-2 font-medium">Lead</th>
                  <th className="px-3 py-2 font-medium">Buyer</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {leads.map((lead) => (
                  <tr key={lead.id} className="bg-background">
                    <td className="px-3 py-3 font-medium">{lead.propertyTitle}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <span className="font-mono text-xs">{lead.id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <span className="font-mono text-xs">{lead.buyerId.slice(0, 8)}…</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="h-8 max-w-full rounded-lg border border-input bg-background px-2 text-xs md:text-sm"
                          value={lead.status}
                          disabled={updating === lead.id}
                          onChange={(e) =>
                            void updateStatus(lead.id, e.target.value)
                          }
                          aria-label={`Status for lead ${lead.id}`}
                        >
                          {!LEAD_STATUSES.includes(
                            lead.status as (typeof LEAD_STATUSES)[number],
                          ) ? (
                            <option value={lead.status}>{lead.status}</option>
                          ) : null}
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
