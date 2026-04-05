import Link from "next/link";
import {
  Building2,
  Scale,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const audiences = [
  {
    title: "Buyers",
    description:
      "Discover listings and connect with verified agents in one structured flow.",
    icon: Users,
  },
  {
    title: "Estate agents",
    description:
      "List stock, run lead CRM, and collaborate with legal and bond partners.",
    icon: Building2,
  },
  {
    title: "Conveyancing attorneys",
    description:
      "Dedicated workspace for transfers and a secure document vault mindset.",
    icon: Scale,
  },
  {
    title: "Bond originators",
    description:
      "Pre-approval pipelines alongside the transaction—not bolted on after.",
    icon: TrendingUp,
  },
] as const;

export default function MarketingHomePage() {
  return (
    <>
      <section
        className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-accent/40 via-background to-background"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.72_0.11_195/0.18),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <Badge
            variant="secondary"
            className="mb-6 font-normal text-muted-foreground"
          >
            South African PropTech
          </Badge>
          <h1
            id="hero-heading"
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[2.75rem] lg:leading-tight max-w-3xl"
          >
            The marketplace layer for property deals—agents, law, and bonds in
            sync.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            SureProp connects every side of the transaction with role-based
            workspaces, API-first integrations, and privacy-conscious handling
            of FICA and conveyancing documents.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Get started
            </Link>
            <Link
              href="/search"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Browse listings
            </Link>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        aria-labelledby="audiences-heading"
      >
        <div className="max-w-2xl">
          <h2
            id="audiences-heading"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Built for every professional in the chain
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Each role gets a focused experience—without fragmenting the
            underlying data model or compliance story.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:gap-6">
          {audiences.map(({ title, description, icon: Icon }) => (
            <li key={title}>
              <Card className="h-full border-border/80 transition-shadow hover:shadow-md motion-reduce:transition-none">
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="border-t border-border bg-muted/25"
        aria-labelledby="trust-heading"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-xl gap-4">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                aria-hidden
              >
                <Shield className="size-6" />
              </div>
              <div>
                <h2
                  id="trust-heading"
                  className="text-xl font-semibold tracking-tight"
                >
                  POPIA-aware by design
                </h2>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Sensitive documents and identity artefacts belong in
                  controlled vaults with audit trails—not in ad-hoc email
                  threads. SureProp is architected for least-privilege access and
                  encryption on storage paths suited to your policies.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
