"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
    <Card className="w-full max-w-md border-border/80 shadow-md motion-reduce:shadow-none">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Choose your primary role. In production, restrict elevated roles with
          admin verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Sign up failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {info ? (
            <Alert>
              <CheckCircle2 className="size-4 text-primary" aria-hidden />
              <AlertTitle>Confirm your email</AlertTitle>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label id="role-label">Role</Label>
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              role="group"
              aria-labelledby="role-label"
            >
              {ROLES.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={appRole === r ? "default" : "outline"}
                  size="sm"
                  className="justify-center font-medium"
                  onClick={() => setAppRole(r)}
                  aria-pressed={appRole === r}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <GoogleAuthButton mode="signup" appRole={appRole} />
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or email
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters. Use a unique passphrase for production
              accounts.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
