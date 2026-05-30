import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const skip = (page - 1) * limit;

    if (!q.trim()) {
      return NextResponse.json({ success: true, data: [], total: 0, page, limit, totalPages: 0 });
    }

    const where: any = {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ],
    };
    if (category) where.category = { slug: category };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where, skip, take: limit,
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: articles, total, page, limit, totalPages: Math.ceil(total / limit), query: q });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
