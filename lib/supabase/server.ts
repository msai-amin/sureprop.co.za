import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableConfig } from "@/lib/supabase/env";

/**
 * Server client for Route Handlers, Server Components, and server actions (cookie session).
 */
export async function createClient() {
  const config = getSupabasePublishableConfig();
  if (!config) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. in Vercel project settings).",
    );
  }
  const { url, anonKey } = config;
  const cookieStore = await cookies();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component without mutable cookies; session refresh happens in middleware.
          }
        },
      },
    },
  );
}
