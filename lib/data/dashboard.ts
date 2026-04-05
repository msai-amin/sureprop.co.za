import "server-only";

import type { AuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

function assertRole(session: AuthSession, allowed: AuthSession["role"][]) {
  if (!allowed.includes(session.role)) {
    throw new Error("Insufficient permissions for this dashboard.");
  }
}

export async function getAgentProperties(session: AuthSession) {
  assertRole(session, ["AGENT", "ADMIN"]);
  const where =
    session.role === "ADMIN" ? {} : { agentId: session.userId };
  const rows = await prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      price: true,
      location: true,
      status: true,
      createdAt: true,
    },
  });
  return rows.map((p) => ({
    ...p,
    price: p.price.toString(),
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
  const where =
    session.role === "ADMIN" ? {} : { agentId: session.userId };
  const rows = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      property: { select: { title: true } },
    },
  });
  return rows.map((l) => ({
    id: l.id,
    status: l.status,
    createdAt: l.createdAt,
    propertyId: l.propertyId,
    buyerId: l.buyerId,
    agentId: l.agentId,
    propertyTitle: l.property.title,
  }));
}

export async function getLawyerDocuments(session: AuthSession) {
  assertRole(session, ["LAWYER", "ADMIN"]);
  const where =
    session.role === "ADMIN" ? {} : { userId: session.userId };
  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      storageUrl: true,
      isEncrypted: true,
      createdAt: true,
      userId: true,
    },
  });
}

export async function getBondSubscription(session: AuthSession) {
  assertRole(session, ["BOND", "ADMIN"]);
  if (session.role === "ADMIN") {
    return prisma.subscription.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        tier: true,
        status: true,
        currentPeriodEnd: true,
        userId: true,
      },
    });
  }
  const sub = await prisma.subscription.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      tier: true,
      status: true,
      currentPeriodEnd: true,
      userId: true,
    },
  });
  return sub ? [sub] : [];
}

export async function getAdminOverview(session: AuthSession) {
  assertRole(session, ["ADMIN"]);
  const [userCount, propertyCount, leadCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.lead.count(),
    prisma.user.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        verificationStatus: true,
        createdAt: true,
      },
    }),
  ]);
  return { userCount, propertyCount, leadCount, recentUsers };
}
