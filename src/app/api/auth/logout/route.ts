import { NextRequest, NextResponse } from "next/server";
import { revokeRefreshToken } from "@/services/user.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
