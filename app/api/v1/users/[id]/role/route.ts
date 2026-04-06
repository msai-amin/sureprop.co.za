import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { badRequestFromZod } from "@/lib/api/validation";
import { requireRoles } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const updateUserRoleSchema = z.object({
  role: z.enum(["BUYER", "AGENT", "LAWYER", "BOND", "ADMIN"]),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles(request, ["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = updateUserRoleSchema.parse(body);
    const { id } = await context.params;

    const adminClient = createAdminClient();

    const { data: existingUser, error: existingError } = await adminClient
      .from("User")
      .select("id,email")
      .eq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existingUser) {
      return NextResponse.json(
        { error: "NotFound", message: "User not found." },
        { status: 404 },
      );
    }

    const { data: authUserData, error: fetchError } =
      await adminClient.auth.admin.getUserById(id);
    if (fetchError || !authUserData?.user) {
      return NextResponse.json(
        { error: "BadRequest", message: "Auth user not found in Supabase." },
        { status: 400 },
      );
    }

    const mergedMetadata = {
      ...(authUserData.user.user_metadata ?? {}),
      app_role: parsed.role,
    };

    const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(
      id,
      {
        user_metadata: mergedMetadata,
      },
    );
    if (updateAuthError) {
      return NextResponse.json(
        {
          error: "InternalError",
          message: "Failed to update Supabase auth metadata.",
        },
        { status: 500 },
      );
    }

    const { data: updated, error: updateDbError } = await adminClient
      .from("User")
      .update({
        role: parsed.role,
        ...(parsed.verificationStatus
          ? { verificationStatus: parsed.verificationStatus }
          : {}),
      })
      .eq("id", id)
      .select("id,email,role,verificationStatus")
      .single();

    if (updateDbError || !updated) throw updateDbError;

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) return badRequestFromZod(error);
    return NextResponse.json(
      { error: "InternalError", message: "Failed to update user role." },
      { status: 500 },
    );
  }
}
