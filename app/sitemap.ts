import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublishableConfig } from "@/lib/supabase/env";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sureprop.co.za";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  if (!getSupabasePublishableConfig()) {
    return entries;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("Property")
      .select("id,updatedAt")
      .eq("status", "ACTIVE")
      .order("updatedAt", { ascending: false })
      .limit(5000);

    if (error || !data) {
      return entries;
    }

    for (const row of data as Array<{ id: string; updatedAt?: string | null }>) {
      entries.push({
        url: `${SITE_URL}/listings/${row.id}`,
        lastModified: row.updatedAt ? new Date(row.updatedAt) : now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    return entries;
  }

  return entries;
}
