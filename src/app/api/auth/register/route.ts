import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerSchema } from "@/types/auth";
import { createUser, createRefreshToken } from "@/services/user.service";
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
    const validated = registerSchema.parse(body);

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

    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
