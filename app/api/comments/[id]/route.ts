import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN","SENIOR_EDITOR","JUNIOR_EDITOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    const comment = await prisma.comment.update({ where: { id }, data: { status } });
    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN","SENIOR_EDITOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete comment" }, { status: 500 });
  }
}
