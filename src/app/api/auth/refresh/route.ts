import { NextRequest, NextResponse } from "next/server";
import {
  validateRefreshToken,
  createRefreshToken,
  revokeRefreshToken,
} from "@/services/user.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token required" },
        { status: 400 },
      );
    }

    const user = await validateRefreshToken(refreshToken);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 },
      );
    }

    await revokeRefreshToken(refreshToken);
    const newRefreshToken = await createRefreshToken(user.id);

    return NextResponse.json({
      success: true,
      data: { refreshToken: newRefreshToken },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
