import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentRegisterForm } from "@/components/dashboard/document-register-form";
import { getAuthSession } from "@/lib/auth/session";
import { getLawyerDocuments } from "@/lib/data/dashboard";

export default async function LawyerDashboardPage() {
  const session = await getAuthSession();
  if (!session || (session.role !== "LAWYER" && session.role !== "ADMIN")) {
    redirect("/");
  }

  const documents = await getLawyerDocuments(session);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Conveyancing vault
        </h1>
        <p className="text-sm text-muted-foreground">
          Document metadata for POPIA-minded workflows. Storage integration uses
          signed URLs for direct uploads.
          {session.role === "ADMIN"
            ? " Admin view: all vault rows."
            : " Your registered files only."}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <DocumentRegisterForm />
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Vault index</CardTitle>
            <CardDescription>
              Registered documents with encryption flags for audit trails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents registered yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/80">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      {session.role === "ADMIN" ? (
                        <th className="px-3 py-2 font-medium">Owner</th>
                      ) : null}
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Path</th>
                      <th className="px-3 py-2 font-medium">Encrypted</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/80">
                    {documents.map((d) => (
                      <tr key={d.id} className="bg-background">
                        {session.role === "ADMIN" ? (
                          <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                            {d.userId.slice(0, 8)}…
                          </td>
                        ) : null}
                        <td className="px-3 py-3">
                          <Badge variant="secondary">{d.type}</Badge>
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-3 font-mono text-xs text-muted-foreground">
                          {d.storageUrl}
                        </td>
                        <td className="px-3 py-3">{d.isEncrypted ? "Yes" : "No"}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {d.createdAt.toLocaleDateString()}
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
    </div>
  );
}
