import { NextResponse } from "next/server";
import {
  getAuthSession,
  type AuthSession,
  type UserRole,
} from "@/lib/auth/session";

type AuthGuardResult =
  | {
      ok: true;
      session: AuthSession;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireRoles(
  request: Request,
  allowedRoles: UserRole[],
): Promise<AuthGuardResult> {
  const session = await getAuthSession(request);

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Missing authentication context." },
        { status: 401 },
      ),
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", message: "Insufficient role permissions." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, session };
}
