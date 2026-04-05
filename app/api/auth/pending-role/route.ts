import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SIGNUP_DEFAULT_ROLE = "BUYER" as const;

/**
 * Stores default signup role before OAuth redirect.
 * Self-signup is locked to BUYER; elevated roles are admin-assigned only.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("sp_pending_role", SIGNUP_DEFAULT_ROLE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.json({ ok: true });
}
