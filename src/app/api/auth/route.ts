import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginSchema, registerSchema } from "@/types/auth";
import {
  createUser,
  validateUser,
  createRefreshToken,
  revokeRefreshToken,
} from "@/services/user.service";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "register") {
      const validated = registerSchema.parse(body.data);

      const user = await createUser({
        email: validated.email,
        name: validated.name,
        password: validated.password,
      });

      const refreshToken = await createRefreshToken(user.id);

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          refreshToken,
        },
      });
    }

    if (action === "login") {
      const validated = loginSchema.parse(body.data);

      const user = await validateUser(validated.email, validated.password);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 },
        );
      }

      const refreshToken = await createRefreshToken(user.id);

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          refreshToken,
        },
      });
    }

    if (action === "refresh") {
      const { refreshToken } = body;

      if (!refreshToken) {
        return NextResponse.json(
          { success: false, error: "Refresh token required" },
          { status: 400 },
        );
      }

      const {
        validateRefreshToken,
        createRefreshToken: createNewRefreshToken,
      } = await import("@/services/user.service");

      const user = await validateRefreshToken(refreshToken);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid refresh token" },
          { status: 401 },
        );
      }

      await revokeRefreshToken(refreshToken);
      const newRefreshToken = await createNewRefreshToken(user.id);

      return NextResponse.json({
        success: true,
        data: { refreshToken: newRefreshToken },
      });
    }

    if (action === "logout") {
      const { refreshToken } = body;

      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Email already exists") {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 409 },
      );
    }

    console.error("Auth error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
