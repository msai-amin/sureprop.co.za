import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { SupabaseConfigAlert } from "@/components/marketing/supabase-config-alert";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ config?: string }>;
}) {
  const { config } = await searchParams;
  const showSupabaseConfigHint = config === "supabase";

  return (
    <div className="relative border-b border-border/60">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.11_195/0.12),transparent)]" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="hidden flex-col justify-center lg:flex">
          <p className="text-sm font-medium text-primary">SureProp</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight lg:text-4xl">
            Sign in to your workspace
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
            Access role-based dashboards for listings, conveyancing, or bond
            pipelines. New here? Create an account in under a minute.
          </p>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "outline" }), "mt-8 w-fit")}
          >
            Create an account
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center lg:items-stretch">
          {showSupabaseConfigHint ? (
            <SupabaseConfigAlert className="mb-6 w-full max-w-md" />
          ) : null}
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">
                Loading sign-in form…
              </p>
            }
          >
            <LoginForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-muted-foreground lg:text-left">
            No account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
