import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublishableConfig } from "@/lib/supabase/env";
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

type SearchParams = Promise<{ q?: string }>;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sureprop.co.za";

export const metadata: Metadata = {
  title: "Property search",
  description:
    "Browse active South African property listings on SureProp. Discover homes, apartments, and land from verified agents.",
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
};

function toStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function displayLocation(location: unknown): string {
  if (!location || typeof location !== "object") return "South Africa";
  const value = location as Record<string, unknown>;
  const parts = [
    toStringValue(value.address),
    toStringValue(value.suburb),
    toStringValue(value.city),
    toStringValue(value.province),
    toStringValue(value.country),
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(", ") : "South Africa";
}

function displayFeatureNumber(features: unknown, key: string): number | null {
  if (!features || typeof features !== "object") return null;
  const value = (features as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toSupabaseLikeTerm(raw: string): string {
  return raw.replace(/[,%()]/g, " ").trim();
}

export default async function PublicPropertySearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const hasSupabase = Boolean(getSupabasePublishableConfig());
  let properties: Array<{
    id: string;
    title: string;
    price: string | number;
    location: unknown;
    features: unknown;
    createdAt: string;
  }> = [];
  let loadFailed = false;

  if (hasSupabase) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("Property")
        .select("id,title,price,location,features,createdAt")
        .eq("status", "ACTIVE")
        .order("createdAt", { ascending: false })
        .limit(60);

      if (q.length > 0) {
        const safeQ = toSupabaseLikeTerm(q);
        query = query.or(
          `title.ilike.%${safeQ}%,location->>suburb.ilike.%${safeQ}%,location->>city.ilike.%${safeQ}%,location->>address.ilike.%${safeQ}%`,
        );
      }

      const { data, error } = await query;
      if (error) {
        loadFailed = true;
      } else {
        properties = (data ?? []) as typeof properties;
      }
    } catch {
      loadFailed = true;
    }
  }

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
                defaultValue={q}
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

      {!hasSupabase ? (
        <div className="mt-12 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">
            Listings are unavailable right now
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Supabase environment variables are missing for this deployment.
          </p>
        </div>
      ) : loadFailed ? (
        <div className="mt-12 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">
            We could not load listings
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Please refresh and try again.
          </p>
        </div>
      ) : properties.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">
            No listings found
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Try a different keyword or clear the search.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const bedrooms = displayFeatureNumber(property.features, "bedrooms");
            const bathrooms = displayFeatureNumber(
              property.features,
              "bathrooms",
            );
            const parking = displayFeatureNumber(property.features, "parking");

            return (
              <article
                key={property.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <h2 className="line-clamp-2 text-base font-semibold leading-tight">
                  <Link
                    href={`/listings/${property.id}`}
                    className="hover:underline underline-offset-4"
                  >
                    {property.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {displayLocation(property.location)}
                </p>
                <p className="mt-4 text-xl font-semibold tabular-nums">
                  R{" "}
                  {Number(property.price).toLocaleString("en-ZA", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {[bedrooms ? `${bedrooms} bed` : null, bathrooms ? `${bathrooms} bath` : null, parking ? `${parking} parking` : null]
                    .filter((item): item is string => Boolean(item))
                    .join(" • ") || "Details coming soon"}
                </p>
                <Link
                  href={`/listings/${property.id}`}
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  View listing
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
