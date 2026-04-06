import "server-only";

import type { AuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function assertRole(session: AuthSession, allowed: AuthSession["role"][]) {
  if (!allowed.includes(session.role)) {
    throw new Error("Insufficient permissions for this dashboard.");
  }
}

export async function getAgentProperties(session: AuthSession) {
  assertRole(session, ["AGENT", "ADMIN"]);
  const supabase = await createClient();
  let query = supabase
    .from("Property")
    .select("id,title,price,location,status,createdAt")
    .order("createdAt", { ascending: false })
    .limit(100);

  if (session.role !== "ADMIN") {
    query = query.eq("agentId", session.userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    price: String((p as { price: string | number }).price),
    createdAt: new Date((p as { createdAt: string }).createdAt),
  }));
}

export type AgentLeadRow = {
  id: string;
  status: string;
  createdAt: Date;
  propertyId: string;
  buyerId: string;
  agentId: string;
  propertyTitle: string;
};

export async function getAgentLeads(session: AuthSession): Promise<AgentLeadRow[]> {
  assertRole(session, ["AGENT", "ADMIN"]);
  const supabase = await createClient();
  let query = supabase
    .from("Lead")
    .select("id,status,createdAt,propertyId,buyerId,agentId")
    .order("createdAt", { ascending: false })
    .limit(100);
  if (session.role !== "ADMIN") {
    query = query.eq("agentId", session.userId);
  }
  const { data: leads, error: leadsError } = await query;
  if (leadsError) throw leadsError;

  const propertyIds = Array.from(
    new Set((leads ?? []).map((lead) => (lead as { propertyId: string }).propertyId)),
  );
  const titleById = new Map<string, string>();
  if (propertyIds.length) {
    const { data: properties, error: propError } = await supabase
      .from("Property")
      .select("id,title")
      .in("id", propertyIds);
    if (propError) throw propError;
    for (const property of properties ?? []) {
      titleById.set(
        (property as { id: string }).id,
        (property as { title: string }).title,
      );
    }
  }

  return (leads ?? []).map((l) => ({
    id: (l as { id: string }).id,
    status: (l as { status: string }).status,
    createdAt: new Date((l as { createdAt: string }).createdAt),
    propertyId: (l as { propertyId: string }).propertyId,
    buyerId: (l as { buyerId: string }).buyerId,
    agentId: (l as { agentId: string }).agentId,
    propertyTitle:
      titleById.get((l as { propertyId: string }).propertyId) ?? "Untitled",
  }));
}

export async function getLawyerDocuments(session: AuthSession) {
  assertRole(session, ["LAWYER", "ADMIN"]);
  const supabase = await createClient();
  let query = supabase
    .from("Document")
    .select("id,type,storageUrl,isEncrypted,createdAt,userId")
    .order("createdAt", { ascending: false })
    .limit(100);
  if (session.role !== "ADMIN") {
    query = query.eq("userId", session.userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    createdAt: new Date((d as { createdAt: string }).createdAt),
  }));
}

export async function getBondSubscription(session: AuthSession) {
  assertRole(session, ["BOND", "ADMIN"]);
  const supabase = await createClient();
  if (session.role === "ADMIN") {
    const { data, error } = await supabase
      .from("Subscription")
      .select("id,tier,status,currentPeriodEnd,userId")
      .order("updatedAt", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((s) => ({
      ...s,
      currentPeriodEnd: (s as { currentPeriodEnd: string | null }).currentPeriodEnd
        ? new Date((s as { currentPeriodEnd: string }).currentPeriodEnd)
        : null,
    }));
  }
  const { data: sub, error } = await supabase
    .from("Subscription")
    .select("id,tier,status,currentPeriodEnd,userId")
    .eq("userId", session.userId)
    .maybeSingle();
  if (error) throw error;
  return sub
    ? [
        {
          ...sub,
          currentPeriodEnd: (sub as { currentPeriodEnd: string | null })
            .currentPeriodEnd
            ? new Date((sub as { currentPeriodEnd: string }).currentPeriodEnd)
            : null,
        },
      ]
    : [];
}

export async function getAdminOverview(session: AuthSession) {
  assertRole(session, ["ADMIN"]);
  const supabase = await createClient();
  const [usersCountRes, propertiesCountRes, leadsCountRes, recentUsersRes] =
    await Promise.all([
      supabase.from("User").select("*", { count: "exact", head: true }),
      supabase.from("Property").select("*", { count: "exact", head: true }),
      supabase.from("Lead").select("*", { count: "exact", head: true }),
      supabase
        .from("User")
        .select("id,email,role,fullName,verificationStatus,createdAt")
        .order("createdAt", { ascending: false })
        .limit(25),
    ]);

  if (recentUsersRes.error) throw recentUsersRes.error;
  const recentUsers = (recentUsersRes.data ?? []).map((u) => ({
    ...u,
    createdAt: new Date((u as { createdAt: string }).createdAt),
  }));

  const userCount = usersCountRes.count ?? 0;
  const propertyCount = propertiesCountRes.count ?? 0;
  const leadCount = leadsCountRes.count ?? 0;
  return { userCount, propertyCount, leadCount, recentUsers };
}
