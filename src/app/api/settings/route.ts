import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateUser } from "@/services/user.service";
import { settingsSchema } from "@/types/auth";
import { z } from "zod";

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const validated = settingsSchema.parse(body);

    const userId = parseInt(session.user.id, 10);
    const updatedUser = await updateUser(userId, { name: validated.name });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("Settings update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
