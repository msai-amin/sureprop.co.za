"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import type { UserRole } from "@/lib/auth/session";
import { dashboardAccessMap } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const authCallbackError = searchParams.get("auth_error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }

      const sync = await fetch("/api/auth/sync-user", { method: "POST" });
      if (!sync.ok) {
        setError("Signed in but profile sync failed. Check app_role metadata.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const raw = user?.user_metadata?.app_role;
      const r = typeof raw === "string" ? raw.toUpperCase() : "";
      const role: UserRole | null =
        r && r in dashboardAccessMap ? (r as UserRole) : null;
      const nextParam = searchParams.get("next");
      const fallback = role ? dashboardAccessMap[role] : "/";
      router.push(nextParam || fallback);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-md motion-reduce:shadow-none">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your SureProp account. Your user must include{" "}
          <code className="rounded bg-muted px-1 text-xs">app_role</code> in
          Supabase metadata.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {queryError === "no_app_role" ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Account setup incomplete</AlertTitle>
              <AlertDescription>
                Google sign-in succeeded but your profile has no{" "}
                <code className="rounded bg-muted px-1 text-xs">app_role</code>.
                Ask an admin to set it in Supabase, or sign up with email after
                choosing a role.
              </AlertDescription>
            </Alert>
          ) : null}
          {queryError === "sync_failed" ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Could not save profile</AlertTitle>
              <AlertDescription>
                Try again. If it persists, confirm{" "}
                <code className="rounded bg-muted px-1 text-xs">DATABASE_URL</code>{" "}
                on the server.
              </AlertDescription>
            </Alert>
          ) : null}
          {authCallbackError ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Sign-in link failed</AlertTitle>
              <AlertDescription>
                {authCallbackError === "missing_code"
                  ? "Missing confirmation code. Request a new email link."
                  : decodeURIComponent(authCallbackError)}
              </AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-3">
            <GoogleAuthButton mode="login" />
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or email
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
