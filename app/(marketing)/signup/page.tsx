import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/lib/button-variants";
import { getSupabasePublishableConfig } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const supabaseConfig = getSupabasePublishableConfig();

  return (
    <div className="relative border-b border-border/60">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.11_195/0.12),transparent)]" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="hidden flex-col justify-center lg:flex">
          <p className="text-sm font-medium text-primary">Join SureProp</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight lg:text-4xl">
            Professional access to the property stack
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
            One account ties your identity to the right dashboard. If email
            confirmation is enabled on the project, you&apos;ll verify your
            inbox before the first sign-in.
          </p>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline" }), "mt-8 w-fit")}
          >
            Already have an account?
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center lg:items-stretch">
          {!supabaseConfig && (
            <Alert variant="destructive" className="mb-6 text-left">
              <AlertTitle>Supabase is not configured</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Add{" "}
                  <code className="rounded bg-background px-1 py-0.5 text-xs">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-background px-1 py-0.5 text-xs">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>{" "}
                  to{" "}
                  <code className="rounded bg-background px-1 py-0.5 text-xs">
                    .env.local
                  </code>{" "}
                  (see{" "}
                  <code className="rounded bg-background px-1 py-0.5 text-xs">
                    env.example
                  </code>
                  ), then restart the dev server.
                </p>
              </AlertDescription>
            </Alert>
          )}
          <SignupForm />
          <p className="mt-6 text-center text-sm text-muted-foreground lg:text-left">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
