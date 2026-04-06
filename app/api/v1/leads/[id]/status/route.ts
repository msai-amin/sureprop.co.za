import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { badRequestFromZod } from "@/lib/api/validation";
import { requireRoles } from "@/lib/auth/guards";
import { writeAuditEvent } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();

    const { data: existing, error: existingError } = await supabase
      .from("Lead")
      .select("id,agentId,status")
      .eq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;
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

    const { data: lead, error: updateError } = await supabase
      .from("Lead")
      .update({ status: parsed.status })
      .eq("id", existing.id)
      .select("id,status,updatedAt,agentId,buyerId,propertyId")
      .single();

    if (updateError || !lead) throw updateError;

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
