import { NextResponse } from "next/server";
import type { UserRole as PrismaUserRole } from "@/app/generated/prisma/enums";
import { getAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/client";

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

  if (!user?.email) {
    return NextResponse.json(
      { error: "BadRequest", message: "User email missing." },
      { status: 400 },
    );
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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "InternalError", message: "Failed to sync user profile." },
      { status: 500 },
    );
  }
}
