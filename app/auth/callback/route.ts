import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { syncUserToDatabase } from "@/lib/auth/sync-profile";

const SIGNUP_DEFAULT_ROLE = "BUYER" as const;

/**
 * PKCE / email-confirm / OAuth return URL. Add to Supabase:
 * Authentication → URL Configuration → Redirect URLs:
 *   https://YOUR_DOMAIN/auth/callback
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?auth_error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code,
  );

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?auth_error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  const cookieStore = await cookies();
  const pending = cookieStore.get("sp_pending_role")?.value?.toUpperCase();
  if (pending === SIGNUP_DEFAULT_ROLE) {
    await supabase.auth.updateUser({
      data: { app_role: SIGNUP_DEFAULT_ROLE },
    });
  }
  cookieStore.delete("sp_pending_role");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?auth_error=no_user`);
  }

  const synced = await syncUserToDatabase(user);

  if (!synced.ok) {
    if (synced.reason === "no_app_role") {
      return NextResponse.redirect(
        `${origin}/login?error=no_app_role`,
      );
    }
    return NextResponse.redirect(`${origin}/login?error=sync_failed`);
  }

  const destination =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return NextResponse.redirect(`${origin}${destination}`);
}
