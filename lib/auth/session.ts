import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "BUYER" | "AGENT" | "LAWYER" | "BOND" | "ADMIN";

export type AuthSession = {
  userId: string;
  role: UserRole;
};

const VALID_ROLES: UserRole[] = ["BUYER", "AGENT", "LAWYER", "BOND", "ADMIN"];

function normalizeRole(value: string | null): UserRole | null {
  if (!value) return null;
  const upper = value.toUpperCase() as UserRole;
  return VALID_ROLES.includes(upper) ? upper : null;
}

/**
 * Maps Supabase Auth user to app session. Set `app_role` in user metadata (Dashboard → Authentication → Users, or on signup).
 */
export function authSessionFromSupabaseUser(user: User): AuthSession | null {
  const raw = user.user_metadata?.app_role;
  const role = normalizeRole(typeof raw === "string" ? raw : null);
  if (!role) return null;
  return { userId: user.id, role };
}

/** Dev-only: override session via headers when AUTH_HEADER_FALLBACK=true */
export function getSessionFromHeaders(headers: Headers): AuthSession | null {
  const userId = headers.get("x-user-id") ?? headers.get("x-auth-user-id");
  const role = normalizeRole(headers.get("x-user-role"));

  if (!userId || !role) return null;

  return { userId, role };
}

export function getSessionFromRequest(request: Request | NextRequest) {
  return getSessionFromHeaders(request.headers);
}

/**
 * Resolves the current user from Supabase session cookies, with optional header fallback for local tooling.
 */
export async function getAuthSession(request?: Request): Promise<AuthSession | null> {
  if (process.env.AUTH_HEADER_FALLBACK === "true" && request) {
    const fallback = getSessionFromHeaders(request.headers);
    if (fallback) return fallback;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return authSessionFromSupabaseUser(user);
}
