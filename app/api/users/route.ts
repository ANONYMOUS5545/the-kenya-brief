import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, image: true, role: true,
          isActive: true, isSuspended: true, bio: true, createdAt: true,
          _count: { select: { articles: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { name, email, password, role, bio } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || "READER", bio },
      select: { id: true, name: true, email: true, role: true, isActive: true, isSuspended: true, createdAt: true },
    });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}
