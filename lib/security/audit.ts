import { createClient } from "@/lib/supabase/server";

type AuditEvent = {
  actorUserId: string;
  action: string;
  resourceType: "LEAD" | "DOCUMENT" | "PROPERTY" | "SUBSCRIPTION";
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(event: AuditEvent) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("AuditLog").insert({
        actorUserId: event.actorUserId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        metadata: event.metadata ?? null,
    });
    if (error) throw error;
  } catch {
    // Keep request flow resilient if audit persistence is temporarily unavailable.
    console.info("[AUDIT_FALLBACK]", {
      at: new Date().toISOString(),
      ...event,
    });
  }
}
