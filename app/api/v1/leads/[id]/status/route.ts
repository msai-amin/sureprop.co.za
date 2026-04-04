import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { badRequestFromZod } from "@/lib/api/validation";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { writeAuditEvent } from "@/lib/security/audit";

const updateLeadStatusSchema = z.object({
  status: z.enum([
    "NEW",
    "CONTACTED",
    "VIEWING_SCHEDULED",
    "OFFER_MADE",
    "CLOSED",
  ]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles(request, ["AGENT", "ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = updateLeadStatusSchema.parse(body);
    const { id } = await context.params;

    const existing = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, agentId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "NotFound", message: "Lead not found." },
        { status: 404 },
      );
    }

    if (auth.session.role !== "ADMIN" && existing.agentId !== auth.session.userId) {
      return NextResponse.json(
        { error: "Forbidden", message: "Lead does not belong to this agent." },
        { status: 403 },
      );
    }

    const lead = await prisma.lead.update({
      where: { id: existing.id },
      data: { status: parsed.status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        agentId: true,
        buyerId: true,
        propertyId: true,
      },
    });

    await writeAuditEvent({
      actorUserId: auth.session.userId,
      action: "LEAD_STATUS_UPDATED",
      resourceType: "LEAD",
      resourceId: lead.id,
      metadata: { fromStatus: existing.status, toStatus: lead.status },
    });

    return NextResponse.json({ data: lead });
  } catch (error) {
    if (error instanceof ZodError) return badRequestFromZod(error);
    return NextResponse.json(
      { error: "InternalError", message: "Failed to update lead status." },
      { status: 500 },
    );
  }
}
