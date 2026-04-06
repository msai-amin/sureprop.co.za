import type { User } from "@supabase/supabase-js";
import { authSessionFromSupabaseUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Upserts `public.User` from Supabase Auth user (requires `app_role` metadata).
 */
export async function syncUserToDatabase(user: User) {
  const session = authSessionFromSupabaseUser(user);
  if (!session) {
    return { ok: false as const, reason: "no_app_role" as const };
  }

  if (!user.email) {
    return { ok: false as const, reason: "no_email" as const };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("User").upsert(
      {
        id: session.userId,
        email: user.email,
        role: session.role,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
      },
      { onConflict: "id" },
    );
    if (error) {
      return { ok: false as const, reason: "db_error" as const };
    }
    return { ok: true as const, session };
  } catch {
    return { ok: false as const, reason: "db_error" as const };
  }
}
