import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type SupabasePublishableConfig = { url: string; anonKey: string };

/**
 * Supabase client bound to the incoming request; mutates `response` when refreshing the session.
 */
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  config: SupabasePublishableConfig,
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  return { supabase, response: supabaseResponse };
}
