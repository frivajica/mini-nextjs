import { NextRequest, NextResponse } from "next/server";
import {
  validateRefreshToken,
  revokeRefreshToken,
} from "@/services/user.service";

const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json({ success: true });
    }

    const user = await validateRefreshToken(refreshToken);

    if (user) {
      await revokeRefreshToken(refreshToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
    return response;
  }
}
