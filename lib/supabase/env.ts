const EXAMPLE_URL_MARKERS = [/your_project_ref/i];
const EXAMPLE_ANON_MARKERS = [/^your_anon_public_key$/i, /^changeme$/i, /^placeholder$/i];

function isPlaceholderSupabaseUrl(url: string): boolean {
  return EXAMPLE_URL_MARKERS.some((re) => re.test(url));
}

function isPlaceholderSupabaseAnonKey(anonKey: string): boolean {
  return EXAMPLE_ANON_MARKERS.some((re) => re.test(anonKey));
}

/**
 * Publishable Supabase settings (safe for browser / edge). Returns null if unset
 * or if values are still `env.example` placeholders.
 */
export function getSupabasePublishableConfig():
  | { url: string; anonKey: string }
  | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (isPlaceholderSupabaseUrl(url) || isPlaceholderSupabaseAnonKey(anonKey)) return null;
  return { url, anonKey };
}

export function requireSupabasePublishableConfig(): { url: string; anonKey: string } {
  const config = getSupabasePublishableConfig();
  if (!config) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see env.example).",
    );
  }
  return config;
}
