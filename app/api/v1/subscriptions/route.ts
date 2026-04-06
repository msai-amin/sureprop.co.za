import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();
    let query = supabase
      .from("Subscription")
      .select("id,userId,tier,status,currentPeriodEnd,paystackCustomerId,createdAt,updatedAt")
      .order("createdAt", { ascending: false });

    if (auth.session.role === "ADMIN") {
      if (requestedUserId) query = query.eq("userId", requestedUserId);
    } else {
      query = query.eq("userId", auth.session.userId);
    }

    const { data: subscriptions, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: subscriptions ?? [],
      accessScope: auth.session.role,
    });
  } catch {
    return NextResponse.json(
      { error: "InternalError", message: "Failed to fetch subscriptions." },
      { status: 500 },
    );
  }
}
