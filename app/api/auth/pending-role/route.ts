import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/auth/session";

const VALID: UserRole[] = ["BUYER", "AGENT", "LAWYER", "BOND", "ADMIN"];

/**
 * Stores chosen signup role in a short-lived cookie before OAuth redirect.
 */
export async function POST(request: Request) {
  let body: { role?: string };
  try {
    body = (await request.json()) as { role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = body.role?.toUpperCase() as UserRole | undefined;
  if (!role || !VALID.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("sp_pending_role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.json({ ok: true });
}
