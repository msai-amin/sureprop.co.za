"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: "BUYER" | "AGENT" | "LAWYER" | "BOND" | "ADMIN";
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
};

const ROLE_OPTIONS = ["BUYER", "AGENT", "LAWYER", "BOND", "ADMIN"] as const;

export function AdminUserRoleTable({ users }: { users: UserRow[] }) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, UserRow["role"]>>(
    () =>
      Object.fromEntries(
        users.map((user) => [user.id, user.role]),
      ) as Record<string, UserRow["role"]>,
  );

  const hasChanges = useMemo(
    () =>
      users.some((user) => {
        const nextRole = roleDraft[user.id] ?? user.role;
        return nextRole !== user.role;
      }),
    [roleDraft, users],
  );

  async function saveRole(user: UserRow) {
    const nextRole = roleDraft[user.id] ?? user.role;
    if (nextRole === user.role) return;

    setSavingId(user.id);
    setError(null);

    try {
      const response = await fetch(`/api/v1/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        setError(json.message ?? "Failed to update role.");
        return;
      }

      window.location.reload();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Recent users</CardTitle>
        <CardDescription>
          Admin-only role promotion. Self-signups remain BUYER by default.
          {hasChanges ? " You have unsaved role changes." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users in database.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/80">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Verification</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {users.map((user) => (
                  <tr key={user.id} className="bg-background">
                    <td className="px-3 py-3">{user.email}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {user.fullName ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                        value={roleDraft[user.id] ?? user.role}
                        onChange={(event) =>
                          setRoleDraft((current) => ({
                            ...current,
                            [user.id]: event.target.value as UserRow["role"],
                          }))
                        }
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <Badge variant="secondary">{user.verificationStatus}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          savingId === user.id ||
                          (roleDraft[user.id] ?? user.role) === user.role
                        }
                        onClick={() => void saveRole(user)}
                      >
                        {savingId === user.id ? "Saving..." : "Save"}
                      </Button>
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
