import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    const existing = await prisma.newsletter.findUnique({ where: { email } });
    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ success: false, error: "Email already subscribed" }, { status: 400 });
      }
      await prisma.newsletter.update({ where: { email }, data: { isActive: true } });
      return NextResponse.json({ success: true, message: "Successfully re-subscribed!" });
    }
    await prisma.newsletter.create({
      data: { email, userId: session?.user ? (session.user as any).id : null },
    });
    return NextResponse.json({ success: true, message: "Successfully subscribed to The Kenya Brief newsletter!" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    await prisma.newsletter.update({ where: { email }, data: { isActive: false } });
    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to unsubscribe" }, { status: 500 });
  }
}
