import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const filterChips = [
  "Western Cape",
  "Gauteng",
  "KZN",
  "Under R3m",
  "House",
  "Apartment",
] as const;

export default function PublicPropertySearchPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Property search
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Explore active listings from verified agents. Full search and map
          experiences ship next—this page establishes the UX pattern and intake
          for your inventory feed.
        </p>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <form
          className="flex flex-col gap-6"
          role="search"
          aria-labelledby="search-form-title"
          action="/search"
          method="get"
        >
          <h2 id="search-form-title" className="sr-only">
            Search properties
          </h2>
          <div className="space-y-2">
            <Label htmlFor="q">Keyword or suburb</Label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <Input
                id="q"
                name="q"
                type="search"
                placeholder="e.g. Claremont, Sea Point, Sandton…"
                className="pl-10 h-11"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Quick filters
            </p>
            <div className="flex flex-wrap gap-2" role="list">
              {filterChips.map((label) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full font-normal"
                  role="listitem"
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Filters are illustrative—wire to your listing API when ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg">
              Search
            </Button>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              List as an agent
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-12 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
        <p className="text-sm font-medium text-foreground">
          No listings to display yet
        </p>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Connect your agent feed or seed properties from the agent dashboard.
          Buyers will see results here once data is available.
        </p>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "mt-6 inline-flex",
          )}
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
