import { NextResponse, type NextRequest } from "next/server";
import { authSessionFromSupabaseUser } from "@/lib/auth/session";
import { dashboardAccessMap } from "@/lib/auth/rbac";
import { getSupabasePublishableConfig } from "@/lib/supabase/env";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const dashboardPathToRole = {
  "/agent": "AGENT",
  "/lawyer": "LAWYER",
  "/bond": "BOND",
  "/admin": "ADMIN",
} as const;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publishable = getSupabasePublishableConfig();

  if (!publishable) {
    const dashboardRoot = Object.keys(dashboardPathToRole).find(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    if (dashboardRoot) {
      const login = new URL("/login", request.url);
      login.searchParams.set("config", "supabase");
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  const { supabase, response } = createSupabaseMiddlewareClient(
    request,
    publishable,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const session = user ? authSessionFromSupabaseUser(user) : null;

  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      const next =
        request.nextUrl.searchParams.get("next") ??
        dashboardAccessMap[session.role];
      return NextResponse.redirect(new URL(next, request.url));
    }
    return response;
  }

  const dashboardRoot = Object.keys(dashboardPathToRole).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!dashboardRoot) {
    return response;
  }

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const expectedRole =
    dashboardPathToRole[dashboardRoot as keyof typeof dashboardPathToRole];

  if (session.role !== expectedRole && session.role !== "ADMIN") {
    const targetPath = dashboardAccessMap[session.role];
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/agent/:path*",
    "/lawyer/:path*",
    "/bond/:path*",
    "/admin/:path*",
  ],
};
