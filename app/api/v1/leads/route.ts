import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireRoles } from "@/lib/auth/guards";
import { badRequestFromZod } from "@/lib/api/validation";
import { writeAuditEvent } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();
    let query = supabase
      .from("Lead")
      .select("id,status,createdAt,updatedAt,propertyId,buyerId,agentId")
      .order("createdAt", { ascending: false })
      .limit(Number.isNaN(limit) ? 50 : limit);

    if (auth.session.role === "AGENT") {
      query = query.eq("agentId", auth.session.userId);
    } else if (auth.session.role === "BUYER") {
      query = query.eq("buyerId", auth.session.userId);
    }

    const { data: leads, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: leads ?? [], accessScope: auth.session.role });
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
    const supabase = await createClient();

    const { data: property, error: propertyError } = await supabase
      .from("Property")
      .select("id,agentId,status")
      .eq("id", parsed.propertyId)
      .maybeSingle();

    if (propertyError) throw propertyError;
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

    const { data: lead, error: insertError } = await supabase
      .from("Lead")
      .insert({
        propertyId: property.id,
        agentId: property.agentId,
        buyerId,
      })
      .select("id,status,propertyId,buyerId,agentId,createdAt")
      .single();

    if (insertError || !lead) throw insertError;

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
