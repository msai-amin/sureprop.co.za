import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request) {
  const auth = await requireRoles(request, [
    "BUYER",
    "AGENT",
    "LAWYER",
    "BOND",
    "ADMIN",
  ]);
  if (!auth.ok) return auth.response;

  const requestedUserId = new URL(request.url).searchParams.get("userId");

  try {
    const where =
      auth.session.role === "ADMIN"
        ? requestedUserId
          ? { userId: requestedUserId }
          : {}
        : { userId: auth.session.userId };

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        tier: true,
        status: true,
        currentPeriodEnd: true,
        paystackCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: subscriptions,
      accessScope: auth.session.role,
    });
  } catch {
    return NextResponse.json(
      { error: "InternalError", message: "Failed to fetch subscriptions." },
      { status: 500 },
    );
  }
}
