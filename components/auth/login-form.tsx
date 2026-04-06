"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
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

async function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  // #region agent log
  await fetch("http://127.0.0.1:7926/ingest/b9a7b057-6775-4a54-91be-9c9c36a216a5", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "0cf523",
    },
    body: JSON.stringify({
      sessionId: "0cf523",
      runId: "signin-debug-pre-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

export function LoginForm() {
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
    // #region agent log
    await debugLog(
      "H1",
      "components/auth/login-form.tsx:onSubmit:start",
      "login submit started",
      {
        hasEmail: email.length > 0,
        hasPassword: password.length > 0,
        hasNextParam: Boolean(searchParams.get("next")),
      },
    );
    // #endregion
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      // #region agent log
      await debugLog(
        "H1",
        "components/auth/login-form.tsx:onSubmit:afterSignIn",
        "signInWithPassword returned",
        {
          hasSignError: Boolean(signError),
          signErrorName: signError?.name ?? null,
          signErrorStatus: signError?.status ?? null,
        },
      );
      // #endregion
      if (signError) {
        setError(signError.message);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      // #region agent log
      await debugLog(
        "H2",
        "components/auth/login-form.tsx:onSubmit:afterGetSession",
        "getSession completed",
        {
          hasSession: Boolean(session),
          sessionUserPresent: Boolean(session?.user),
        },
      );
      // #endregion
      if (!session) {
        setError(
          "Signed in but the session was not stored. Try again or check browser cookie settings.",
        );
        return;
      }

      let sync: Response;
      try {
        const syncStartedAt = Date.now();
        sync = await fetch("/api/auth/sync-user", {
          method: "POST",
          credentials: "same-origin",
          signal: AbortSignal.timeout(25_000),
        });
        // #region agent log
        await debugLog(
          "H3",
          "components/auth/login-form.tsx:onSubmit:afterSyncFetch",
          "sync-user request finished",
          {
            syncOk: sync.ok,
            syncStatus: sync.status,
            syncDurationMs: Date.now() - syncStartedAt,
          },
        );
        // #endregion
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        // #region agent log
        await debugLog(
          "H3",
          "components/auth/login-form.tsx:onSubmit:syncFetchError",
          "sync-user request failed",
          {
            errorName: name || null,
          },
        );
        // #endregion
        if (name === "TimeoutError" || name === "AbortError") {
          setError(
            "Profile sync timed out. Check your connection, then try again.",
          );
          return;
        }
        throw err;
      }

      if (!sync.ok) {
        setError("Signed in but profile sync failed. Check app_role metadata.");
        return;
      }

      const nextParam = searchParams.get("next");
      const destination =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : "/";
      // #region agent log
      await debugLog(
        "H5",
        "components/auth/login-form.tsx:onSubmit:beforeNavigation",
        "about to navigate after sign in",
        { destination },
      );
      // #endregion
      window.location.assign(destination);
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
                Try again. If it persists, confirm Supabase table access and
                RLS policies for profile sync.
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
