import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { syncUserToDatabase } from "@/lib/auth/sync-profile";

async function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  // #region agent log
  await fetch("http://127.0.0.1:7926/ingest/b9a7b057-6775-4a54-91be-9c9c36a216a5", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "0cf523",
    },
    body: JSON.stringify({
      sessionId: "0cf523",
      runId: "signin-debug-pre-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

/**
 * Upserts `public.User` to match `auth.users` after sign-in/sign-up.
 * Requires `app_role` in JWT metadata (see lib/auth/session.ts).
 */
export async function POST() {
  // #region agent log
  await debugLog(
    "H3",
    "app/api/auth/sync-user/route.ts:POST:start",
    "sync-user handler invoked",
    {},
  );
  // #endregion
  const session = await getAuthSession();
  // #region agent log
  await debugLog(
    "H3",
    "app/api/auth/sync-user/route.ts:POST:afterGetAuthSession",
    "getAuthSession completed",
    {
      hasSession: Boolean(session),
      sessionRole: session?.role ?? null,
    },
  );
  // #endregion
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
  // #region agent log
  await debugLog(
    "H4",
    "app/api/auth/sync-user/route.ts:POST:afterGetUser",
    "supabase.auth.getUser completed",
    {
      hasUser: Boolean(user),
      hasAppRoleMetadata:
        typeof user?.user_metadata?.app_role === "string" &&
        user.user_metadata.app_role.length > 0,
    },
  );
  // #endregion

  if (!user) {
    return NextResponse.json(
      { error: "BadRequest", message: "User not found." },
      { status: 400 },
    );
  }

  const result = await syncUserToDatabase(user);
  // #region agent log
  await debugLog(
    "H4",
    "app/api/auth/sync-user/route.ts:POST:afterSyncUser",
    "syncUserToDatabase finished",
    {
      ok: result.ok,
      reason: result.ok ? null : result.reason,
    },
  );
  // #endregion

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
