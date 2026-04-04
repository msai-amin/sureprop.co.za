import Link from "next/link";

export default function MarketingHomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-3 p-8">
      <h1 className="text-3xl font-semibold">CPT Property</h1>
      <p className="text-sm text-zinc-600">
        Public marketplace entry point for buyers, agents, lawyers, and bond
        originators.
      </p>
      <nav className="flex flex-wrap gap-4 text-sm font-medium">
        <Link href="/login" className="underline">
          Sign in
        </Link>
        <Link href="/signup" className="underline">
          Sign up
        </Link>
        <Link href="/search" className="underline">
          Search
        </Link>
        <Link href="/pricing" className="underline">
          Pricing
        </Link>
      </nav>
    </main>
  );
}
