import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/client";

type AuditEvent = {
  actorUserId: string;
  action: string;
  resourceType: "LEAD" | "DOCUMENT" | "PROPERTY" | "SUBSCRIPTION";
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(event: AuditEvent) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: event.actorUserId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        metadata: event.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Keep request flow resilient if audit persistence is temporarily unavailable.
    console.info("[AUDIT_FALLBACK]", {
      at: new Date().toISOString(),
      ...event,
    });
  }
}
