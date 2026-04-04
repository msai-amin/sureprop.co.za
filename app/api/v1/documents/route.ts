import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { badRequestFromZod } from "@/lib/api/validation";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { writeAuditEvent } from "@/lib/security/audit";
import { buildVaultStoragePath, getSignedDocumentUrl } from "@/lib/storage/vault";

const createDocumentSchema = z.object({
  userId: z.uuid().optional(),
  type: z.enum(["ID", "BANK_STATEMENT", "OFFER_TO_PURCHASE"]),
  fileName: z.string().min(1).max(255),
});

export async function GET(request: Request) {
  const auth = await requireRoles(request, [
    "BUYER",
    "AGENT",
    "LAWYER",
    "BOND",
    "ADMIN",
  ]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const requestedUserId = url.searchParams.get("userId");

  try {
    const where =
      auth.session.role === "ADMIN"
        ? requestedUserId
          ? { userId: requestedUserId }
          : {}
        : { userId: auth.session.userId };

    const documents = await prisma.document.findMany({
      where,
      take: Number.isNaN(limit) ? 50 : limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        type: true,
        storageUrl: true,
        isEncrypted: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: documents, accessScope: auth.session.role });
  } catch {
    return NextResponse.json(
      { error: "InternalError", message: "Failed to fetch documents." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRoles(request, [
    "BUYER",
    "AGENT",
    "LAWYER",
    "BOND",
    "ADMIN",
  ]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = createDocumentSchema.parse(body);
    const ownerUserId =
      auth.session.role === "ADMIN"
        ? parsed.userId ?? auth.session.userId
        : auth.session.userId;

    const storageUrl = buildVaultStoragePath(ownerUserId, parsed.fileName);

    const document = await prisma.document.create({
      data: {
        userId: ownerUserId,
        type: parsed.type,
        storageUrl,
        isEncrypted: true,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        storageUrl: true,
        isEncrypted: true,
        createdAt: true,
      },
    });

    await writeAuditEvent({
      actorUserId: auth.session.userId,
      action: "DOCUMENT_METADATA_CREATED",
      resourceType: "DOCUMENT",
      resourceId: document.id,
      metadata: { ownerUserId, type: document.type },
    });

    const uploadUrl = await getSignedDocumentUrl(document.storageUrl);

    return NextResponse.json({ data: document, uploadUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return badRequestFromZod(error);
    return NextResponse.json(
      { error: "InternalError", message: "Failed to create document metadata." },
      { status: 500 },
    );
  }
}
