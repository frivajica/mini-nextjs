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

function parseUserId(id: string): number | null {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) || parsed < 1 ? null : parsed;
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

  const userId = parseUserId(session.user.id);

  if (!userId) {
    return {
      response: NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 },
      ),
      user: null,
    };
  }

  return {
    user: {
      id: userId,
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
