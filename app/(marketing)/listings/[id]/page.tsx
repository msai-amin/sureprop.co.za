import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublishableConfig } from "@/lib/supabase/env";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sureprop.co.za";

type Params = Promise<{ id: string }>;

type PropertyRow = {
  id: string;
  title: string;
  price: string | number;
  location: unknown;
  features: unknown;
};

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function locationParts(location: unknown) {
  if (!location || typeof location !== "object") return [];
  const row = location as Record<string, unknown>;
  return [
    asText(row.address),
    asText(row.suburb),
    asText(row.city),
    asText(row.province),
    asText(row.country),
  ].filter((part): part is string => Boolean(part));
}

function featureNumber(features: unknown, key: string): number | null {
  if (!features || typeof features !== "object") return null;
  const value = (features as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sourceImage(features: unknown): string | null {
  if (!features || typeof features !== "object") return null;
  const value = (features as Record<string, unknown>).imageUrl;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

function sourceUrl(features: unknown): string | null {
  if (!features || typeof features !== "object") return null;
  const value = (features as Record<string, unknown>).sourceUrl;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

async function getPropertyById(id: string): Promise<PropertyRow | null> {
  if (!getSupabasePublishableConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Property")
    .select("id,title,price,location,features,status")
    .eq("id", id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error || !data) return null;
  return data as PropertyRow;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    return {
      title: "Listing not found",
      robots: { index: false, follow: false },
    };
  }

  const place = locationParts(property.location).join(", ") || "South Africa";
  const image = sourceImage(property.features);
  const canonical = `${SITE_URL}/listings/${property.id}`;

  return {
    title: property.title,
    description: `${property.title} in ${place}. Listed at R ${Number(
      property.price,
    ).toLocaleString("en-ZA")}.`,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: property.title,
      description: `${property.title} in ${place}.`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description: `${property.title} in ${place}.`,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicListingPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    notFound();
  }

  const place = locationParts(property.location).join(", ") || "South Africa";
  const bedrooms = featureNumber(property.features, "bedrooms");
  const bathrooms = featureNumber(property.features, "bathrooms");
  const parking = featureNumber(property.features, "parking");
  const floorSize = featureNumber(property.features, "floorSizeSqm");
  const externalSource = sourceUrl(property.features);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/search" className="hover:underline underline-offset-4">
          Back to search
        </Link>
      </nav>

      <article className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {property.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{place}</p>
        <p className="mt-5 text-3xl font-semibold tabular-nums">
          R{" "}
          {Number(property.price).toLocaleString("en-ZA", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>

        <p className="mt-4 text-sm text-muted-foreground">
          {[bedrooms ? `${bedrooms} bed` : null, bathrooms ? `${bathrooms} bath` : null, parking ? `${parking} parking` : null, floorSize ? `${floorSize} m²` : null]
            .filter((item): item is string => Boolean(item))
            .join(" • ") || "Detailed specs coming soon"}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Contact an agent
          </Link>
          {externalSource ? (
            <a
              href={externalSource}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              View source listing
            </a>
          ) : null}
        </div>
      </article>
    </div>
  );
}
