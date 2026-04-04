import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-md flex-col gap-2">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          After sign-up, your profile is synced to the app database. If email
          confirmation is on, confirm your email before signing in.
        </p>
      </div>
      <SignupForm />
      <p className="text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
