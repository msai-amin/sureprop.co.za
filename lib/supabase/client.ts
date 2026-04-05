import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublishableConfig } from "@/lib/supabase/env";

/**
 * Browser client for client components (uses anon key; RLS applies).
 */
export function createClient() {
  const { url, anonKey } = requireSupabasePublishableConfig();
  return createBrowserClient(url, anonKey);
}
