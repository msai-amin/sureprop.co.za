import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireRoles } from "@/lib/auth/guards";
import { badRequestFromZod } from "@/lib/api/validation";
import { prisma } from "@/lib/db/client";
import { writeAuditEvent } from "@/lib/security/audit";

const createLeadSchema = z.object({
  propertyId: z.uuid(),
  buyerId: z.uuid().optional(),
});

export async function GET(request: Request) {
  const auth = await requireRoles(request, ["BUYER", "AGENT", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

  try {
    const where =
      auth.session.role === "ADMIN"
        ? {}
        : auth.session.role === "AGENT"
          ? { agentId: auth.session.userId }
          : { buyerId: auth.session.userId };

    const leads = await prisma.lead.findMany({
      where,
      take: Number.isNaN(limit) ? 50 : limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        propertyId: true,
        buyerId: true,
        agentId: true,
      },
    });

    return NextResponse.json({ data: leads, accessScope: auth.session.role });
  } catch {
    return NextResponse.json(
      { error: "InternalError", message: "Failed to fetch leads." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRoles(request, ["BUYER", "ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = createLeadSchema.parse(body);

    const property = await prisma.property.findUnique({
      where: { id: parsed.propertyId },
      select: { id: true, agentId: true, status: true },
    });

    if (!property || property.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "NotFound", message: "Active property not found." },
        { status: 404 },
      );
    }

    const buyerId =
      auth.session.role === "ADMIN"
        ? parsed.buyerId ?? auth.session.userId
        : auth.session.userId;

    const lead = await prisma.lead.create({
      data: {
        propertyId: property.id,
        agentId: property.agentId,
        buyerId,
      },
      select: {
        id: true,
        status: true,
        propertyId: true,
        buyerId: true,
        agentId: true,
        createdAt: true,
      },
    });

    await writeAuditEvent({
      actorUserId: auth.session.userId,
      action: "LEAD_CREATED",
      resourceType: "LEAD",
      resourceId: lead.id,
      metadata: { propertyId: lead.propertyId, buyerId: lead.buyerId },
    });

    return NextResponse.json({ data: lead }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return badRequestFromZod(error);
    return NextResponse.json(
      { error: "InternalError", message: "Failed to create lead." },
      { status: 500 },
    );
  }
}
