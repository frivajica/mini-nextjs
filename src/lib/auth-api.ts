import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { SessionUser, UserRole } from "@/types";

export interface AuthResult {
  user: SessionUser;
}

export interface UnauthorizedResult {
  response: NextResponse;
  user: null;
}

export async function requireAuth(): Promise<AuthResult | UnauthorizedResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      ),
      user: null,
    };
  }

  return {
    user: {
      id: parseInt(session.user.id, 10),
      email: session.user.email || "",
      name: session.user.name || null,
      role: session.user.role as UserRole,
    },
  };
}

export async function requireAdmin(): Promise<AuthResult | UnauthorizedResult> {
  const authResult = await requireAuth();

  if (!authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== "ADMIN") {
    return {
      response: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      ),
      user: null,
    };
  }

  return authResult;
}
