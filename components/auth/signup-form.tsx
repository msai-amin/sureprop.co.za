"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/auth/session";
import { dashboardAccessMap } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/client";

const ROLES: UserRole[] = ["BUYER", "AGENT", "LAWYER", "BOND", "ADMIN"];

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [appRole, setAppRole] = useState<UserRole>("BUYER");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { app_role: appRole },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (signError) {
        setError(signError.message);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setInfo(
          "Check your email to confirm your account, then return to sign in.",
        );
        return;
      }

      const sync = await fetch("/api/auth/sync-user", { method: "POST" });
      if (!sync.ok) {
        setError("Account created but profile sync failed.");
        return;
      }

      router.push(dashboardAccessMap[appRole]);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">Create account</h2>
      <p className="text-xs text-zinc-500">
        Role is stored as <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">app_role</code>{" "}
        metadata. Production should restrict roles (e.g. agents verified by admin).
      </p>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {info}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Role
        <select
          value={appRole}
          onChange={(e) => setAppRole(e.target.value as UserRole)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Creating…" : "Sign up"}
      </button>
    </form>
  );
}
