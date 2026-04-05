"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/lib/auth/session";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const DASH_LINKS: { href: string; label: string; roles: UserRole[] }[] = [
  { href: "/agent", label: "Agent", roles: ["AGENT", "ADMIN"] },
  { href: "/lawyer", label: "Lawyer", roles: ["LAWYER", "ADMIN"] },
  { href: "/bond", label: "Bond", roles: ["BOND", "ADMIN"] },
  { href: "/admin", label: "Admin", roles: ["ADMIN"] },
];

export function DashboardShell({
  role,
  email,
  children,
}: {
  role: UserRole;
  email: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const links = DASH_LINKS.filter((l) => l.roles.includes(role));

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8">
            <Link
              href="/"
              className="shrink-0 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              SureProp
            </Link>
            <nav
              className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 sm:gap-6"
              aria-label="Dashboard"
            >
              <Link
                href="/"
                className={cn(
                  "text-sm text-muted-foreground transition-colors hover:text-foreground",
                  pathname === "/" && "font-medium text-foreground",
                )}
              >
                Home
              </Link>
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "text-sm transition-colors",
                    pathname === l.href || pathname.startsWith(`${l.href}/`)
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span
              className="hidden max-w-[160px] truncate text-xs text-muted-foreground lg:inline"
              title={email ?? undefined}
            >
              {email ?? "—"}
            </span>
            <span
              className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              title="App role"
            >
              {role}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
