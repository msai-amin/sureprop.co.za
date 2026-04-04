import type { UserRole } from "@/lib/auth/session";

export const dashboardAccessMap: Record<UserRole, string> = {
  ADMIN: "/admin",
  AGENT: "/agent",
  BOND: "/bond",
  BUYER: "/",
  LAWYER: "/lawyer",
};
