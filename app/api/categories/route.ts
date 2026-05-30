import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            articles: { where: { status: "PUBLISHED" } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name);
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        color,
        icon,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}
