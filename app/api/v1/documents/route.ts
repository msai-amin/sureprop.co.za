import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { badRequestFromZod } from "@/lib/api/validation";
import { requireRoles } from "@/lib/auth/guards";
import { writeAuditEvent } from "@/lib/security/audit";
import { buildVaultStoragePath, getSignedDocumentUrl } from "@/lib/storage/vault";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();
    let query = supabase
      .from("Document")
      .select("id,userId,type,storageUrl,isEncrypted,createdAt")
      .order("createdAt", { ascending: false })
      .limit(Number.isNaN(limit) ? 50 : limit);

    if (auth.session.role === "ADMIN") {
      if (requestedUserId) query = query.eq("userId", requestedUserId);
    } else {
      query = query.eq("userId", auth.session.userId);
    }

    const { data: documents, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: documents ?? [], accessScope: auth.session.role });
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
    const supabase = await createClient();

    const { data: document, error } = await supabase
      .from("Document")
      .insert({
        userId: ownerUserId,
        type: parsed.type,
        storageUrl,
        isEncrypted: true,
      })
      .select("id,userId,type,storageUrl,isEncrypted,createdAt")
      .single();

    if (error || !document) throw error;

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
