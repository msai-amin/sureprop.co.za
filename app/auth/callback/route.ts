import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { dashboardAccessMap } from "@/lib/auth/rbac";
import type { UserRole } from "@/lib/auth/session";
import { syncUserToDatabase } from "@/lib/auth/sync-profile";

const VALID_ROLES: UserRole[] = ["BUYER", "AGENT", "LAWYER", "BOND", "ADMIN"];

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
  if (pending && VALID_ROLES.includes(pending as UserRole)) {
    await supabase.auth.updateUser({
      data: { app_role: pending },
    });
    cookieStore.delete("sp_pending_role");
  }

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

  const role = synced.session.role;
  const fallback = dashboardAccessMap[role];
  const destination =
    next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;

  return NextResponse.redirect(`${origin}${destination}`);
}
