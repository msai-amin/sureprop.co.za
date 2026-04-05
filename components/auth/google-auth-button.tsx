"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  mode: "login" | "signup";
  /** Required when signing up with Google so `app_role` can be stored after OAuth. */
  appRole?: UserRole;
};

export function GoogleAuthButton({ mode, appRole }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    try {
      if (mode === "signup") {
        if (!appRole) {
          setError("Choose a role first.");
          setPending(false);
          return;
        }
        const res = await fetch("/api/auth/pending-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: appRole }),
        });
        if (!res.ok) {
          setError("Could not start Google sign-up. Try again.");
          setPending(false);
          return;
        }
      }

      const supabase = createClient();
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setPending(false);
      }
    } catch {
      setError("Something went wrong.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={() => void handleClick()}
      >
        {pending ? "Redirecting…" : "Continue with Google"}
      </Button>
    </div>
  );
}
