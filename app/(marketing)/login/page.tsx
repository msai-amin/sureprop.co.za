import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-md flex-col gap-2">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Use the account you created in Supabase Auth (
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            app_role
          </code>{" "}
          must be set on the user).
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-zinc-500">Loading sign-in form…</p>
        }
      >
        <LoginForm />
      </Suspense>
      <p className="text-sm text-zinc-600">
        No account?{" "}
        <Link href="/signup" className="font-medium underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
