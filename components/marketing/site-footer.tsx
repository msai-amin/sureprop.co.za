import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              SureProp
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
              A multi-sided marketplace for property in South Africa—linking
              buyers, estate agents, conveyancing attorneys, and bond
              originators with privacy-first tools.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Product
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/search"
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Property search
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Account
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            POPIA: we treat personal information and supporting documents with
            strict access controls and encryption where applicable. This site is
            for professional use—review your organisation&apos;s privacy
            policy and lawful basis for processing.
          </p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            © {year} SureProp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
