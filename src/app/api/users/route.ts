import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "@/services/user.service";
import { updateUserSchema } from "@/types/auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        return NextResponse.json(
          { success: false, error: "Invalid user ID" },
          { status: 400 },
        );
      }

      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
        );
      }

      const { password: _, ...sanitizedUser } = user;
      return NextResponse.json({ success: true, data: sanitizedUser });
    }

    const users = await getUsers();
    const sanitizedUsers = users.map(({ password: _, ...user }) => user);
    return NextResponse.json({ success: true, data: sanitizedUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 },
      );
    }

    const validated = updateUserSchema.parse(data);
    const user = await updateUser(id, validated);

    const { password: _, ...sanitizedUser } = user;
    return NextResponse.json({ success: true, data: sanitizedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 },
      );
    }

    await deleteUser(parseInt(id, 10));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
