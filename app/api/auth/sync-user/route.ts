import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { syncUserToDatabase } from "@/lib/auth/sync-profile";

/**
 * Upserts `public.User` to match `auth.users` after sign-in/sign-up.
 * Requires `app_role` in JWT metadata (see lib/auth/session.ts).
 */
export async function POST() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Not signed in." },
      { status: 401 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "BadRequest", message: "User not found." },
      { status: 400 },
    );
  }

  const result = await syncUserToDatabase(user);

  if (!result.ok) {
    const message =
      result.reason === "no_app_role"
        ? "Missing app_role in user metadata."
        : result.reason === "no_email"
          ? "User email missing."
          : "Failed to sync user profile.";
    return NextResponse.json(
      { error: "BadRequest", message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
