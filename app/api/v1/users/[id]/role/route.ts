import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { badRequestFromZod } from "@/lib/api/validation";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
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

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "NotFound", message: "User not found." },
        { status: 404 },
      );
    }

    const adminClient = createAdminClient();
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

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: parsed.role,
        ...(parsed.verificationStatus
          ? { verificationStatus: parsed.verificationStatus }
          : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        verificationStatus: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) return badRequestFromZod(error);
    return NextResponse.json(
      { error: "InternalError", message: "Failed to update user role." },
      { status: 500 },
    );
  }
}
