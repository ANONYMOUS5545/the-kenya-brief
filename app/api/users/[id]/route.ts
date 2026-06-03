import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface Params { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const user = session.user as any;
    if (user.role !== "ADMIN" && user.id !== id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const found = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, image: true, role: true,
        isActive: true, isSuspended: true, bio: true, createdAt: true,
        _count: { select: { articles: true, comments: true } },
      },
    });
    if (!found) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: found });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const user = session.user as any;
    const isAdmin = user.role === "ADMIN";
    if (!isAdmin && user.id !== id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { name, bio, image, role, isActive, isSuspended, password } = body;
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (image !== undefined) updateData.image = image;
    if (isAdmin) {
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
    }
    if (password) updateData.password = await bcrypt.hash(password, 12);
    const updated = await prisma.user.update({
      where: { id }, data: updateData,
      select: { id: true, name: true, email: true, image: true, role: true, isActive: true, isSuspended: true, bio: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
