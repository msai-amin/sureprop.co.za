import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import type { Prisma } from "@/app/generated/prisma/client";
import { badRequestFromZod } from "@/lib/api/validation";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { writeAuditEvent } from "@/lib/security/audit";

const propertyStatusSchema = z.enum(["ACTIVE", "SOLD", "UNDER_OFFER"]);

const createPropertySchema = z.object({
  agentId: z.uuid().optional(),
  title: z.string().min(3).max(200),
  price: z.coerce.number().positive(),
  location: z.record(z.string(), z.unknown()),
  features: z.record(z.string(), z.unknown()).optional(),
  status: propertyStatusSchema.optional(),
});

export async function GET(request: Request) {
  const auth = await requireRoles(request, ["AGENT", "ADMIN"]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const status = url.searchParams.get("status");

  try {
    const where = {
      ...(auth.session.role === "ADMIN" ? {} : { agentId: auth.session.userId }),
      ...(status ? { status: status as "ACTIVE" | "SOLD" | "UNDER_OFFER" } : {}),
    };

    const properties = await prisma.property.findMany({
      where,
      take: Number.isNaN(limit) ? 50 : limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        price: true,
        location: true,
        features: true,
        status: true,
        agentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: properties,
      accessScope: auth.session.role,
    });
  } catch {
    return NextResponse.json(
      { error: "InternalError", message: "Failed to fetch properties." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRoles(request, ["AGENT", "ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = createPropertySchema.parse(body);
    const agentId =
      auth.session.role === "ADMIN"
        ? parsed.agentId ?? auth.session.userId
        : auth.session.userId;

    const property = await prisma.property.create({
      data: {
        agentId,
        title: parsed.title,
        price: parsed.price,
        location: parsed.location as Prisma.InputJsonValue,
        features: (parsed.features ?? {}) as Prisma.InputJsonValue,
        status: parsed.status ?? "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        price: true,
        location: true,
        features: true,
        status: true,
        agentId: true,
        createdAt: true,
      },
    });

    await writeAuditEvent({
      actorUserId: auth.session.userId,
      action: "PROPERTY_CREATED",
      resourceType: "PROPERTY",
      resourceId: property.id,
      metadata: { agentId: property.agentId, status: property.status },
    });

    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return badRequestFromZod(error);
    return NextResponse.json(
      { error: "InternalError", message: "Failed to create property." },
      { status: 500 },
    );
  }
}
