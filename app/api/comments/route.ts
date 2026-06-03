import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && ["ADMIN", "SENIOR_EDITOR"].includes((session.user as any).role);

    const where: any = { parentId: null };
    if (articleId) where.articleId = articleId;
    if (status && isAdmin) where.status = status;
    else if (!isAdmin) where.status = "APPROVED";

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: {
            where: { status: isAdmin ? undefined : "APPROVED" },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { replies: true } },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: comments, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ success: true, data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { articleId, content, guestName, guestEmail, parentId } = body;

    if (!articleId || !content) {
      return NextResponse.json({ success: false, error: "Article ID and content are required" }, { status: 400 });
    }
    if (!session?.user && (!guestName || !guestEmail)) {
      return NextResponse.json({ success: false, error: "Name and email required for guest comments" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article || article.status !== "PUBLISHED") {
      return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        articleId,
        parentId: parentId || null,
        userId: session?.user ? (session.user as any).id : null,
        guestName: session?.user ? null : guestName,
        guestEmail: session?.user ? null : guestEmail,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ success: true, data: comment, message: "Comment submitted for review" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to post comment" }, { status: 500 });
  }
}
