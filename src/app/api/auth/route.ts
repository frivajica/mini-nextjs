import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginSchema, registerSchema } from "@/types/auth";
import {
  createUser,
  validateUser,
  createRefreshToken,
  revokeRefreshToken,
} from "@/services/user.service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimitResult = await checkRateLimit(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
        },
      },
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
