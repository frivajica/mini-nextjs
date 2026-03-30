import { NextRequest, NextResponse } from "next/server";
import {
  validateRefreshToken,
  createRefreshToken,
  revokeRefreshToken,
} from "@/services/user.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
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
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token required" },
        { status: 400 },
      );
    }

    const user = await validateRefreshToken(refreshToken);

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 },
      );
      response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
      return response;
    }

    let newRefreshToken: string | null = null;

    try {
      newRefreshToken = await createRefreshToken(user.id);
      await revokeRefreshToken(refreshToken);
    } catch (tokenError) {
      if (newRefreshToken) {
        await revokeRefreshToken(newRefreshToken).catch(() => {});
      }
      throw tokenError;
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
