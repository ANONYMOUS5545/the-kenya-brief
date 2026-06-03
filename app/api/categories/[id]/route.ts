import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

interface Params { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, color, icon, sortOrder, isActive } = body;

    const updateData: any = {};
    if (name) { updateData.name = name; updateData.slug = slugify(name); }
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await prisma.category.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, message: "Category deactivated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
  }
}
