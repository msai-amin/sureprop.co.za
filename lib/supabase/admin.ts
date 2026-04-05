import { createClient } from "@supabase/supabase-js";
import { getSupabasePublishableConfig } from "@/lib/supabase/env";

/**
 * Server-only admin client for privileged Supabase auth operations.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server.
 */
export function createAdminClient() {
  const publishable = getSupabasePublishableConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!publishable || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(publishable.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
