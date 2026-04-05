import type { User } from "@supabase/supabase-js";
import type { UserRole as PrismaUserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/db/client";
import { authSessionFromSupabaseUser } from "@/lib/auth/session";

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
    await prisma.user.upsert({
      where: { id: session.userId },
      create: {
        id: session.userId,
        email: user.email,
        role: session.role as PrismaUserRole,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
      },
      update: {
        email: user.email,
        role: session.role as PrismaUserRole,
      },
    });
    return { ok: true as const, session };
  } catch {
    return { ok: false as const, reason: "db_error" as const };
  }
}
