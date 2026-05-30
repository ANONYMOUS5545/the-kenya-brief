import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN","SENIOR_EDITOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalArticles, publishedArticles, pendingArticles, draftArticles,
      totalUsers, adminCount, editorCount, readerCount,
      totalComments, pendingComments,
      totalViews,
      recentArticles, topArticles, categoryStats,
    ] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.article.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: { in: ["SENIOR_EDITOR", "JUNIOR_EDITOR"] } } }),
      prisma.user.count({ where: { role: "READER" } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { status: "PENDING" } }),
      prisma.article.aggregate({ _sum: { viewCount: true } }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        take: 10,
        select: { id: true, title: true, slug: true, viewCount: true, publishedAt: true },
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: { articles: { where: { status: "PUBLISHED" } } },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        articles: { total: totalArticles, published: publishedArticles, pending: pendingArticles, draft: draftArticles },
        users: { total: totalUsers, admins: adminCount, editors: editorCount, readers: readerCount },
        comments: { total: totalComments, pending: pendingComments },
        views: totalViews._sum.viewCount || 0,
        recentArticles,
        topArticles,
        categoryStats,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
