import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, estimateReadTime, generateMetaDescription } from "@/lib/utils";
import type { ArticleStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const status = searchParams.get("status") as ArticleStatus | null;
    const featured = searchParams.get("featured") === "true";
    const trending = searchParams.get("trending") === "true";
    const breaking = searchParams.get("breaking") === "true";
    const search = searchParams.get("search");
    const authorId = searchParams.get("authorId");
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);
    const isEditor = session?.user &&
      ["ADMIN", "SENIOR_EDITOR", "JUNIOR_EDITOR"].includes((session.user as any).role);

    const where: Record<string, unknown> = {};
    if (!isEditor) {
      where.status = "PUBLISHED";
    } else if (status) {
      where.status = status;
    }
    if (category) where.category = { slug: category };
    if (featured) where.isFeatured = true;
    if (trending) where.isTrending = true;
    if (breaking) where.isBreaking = true;
    if (authorId) where.authorId = authorId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      success: true, data: articles, total, page, limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;
    const allowedRoles = ["ADMIN", "SENIOR_EDITOR", "JUNIOR_EDITOR"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title, excerpt, content, featuredImage, featuredImageAlt,
      videoUrl, categoryId, tags = [], isFeatured, isTrending, isBreaking,
      metaTitle, metaDescription, status,
    } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json({ success: false, error: "Title, content, and category are required" }, { status: 400 });
    }

    const slug = slugify(title);
    const readTime = estimateReadTime(content);
    const autoExcerpt = excerpt || generateMetaDescription(content);

    let articleStatus = "DRAFT";
    if (status === "PENDING_REVIEW") articleStatus = "PENDING_REVIEW";
    if ((user.role === "ADMIN" || user.role === "SENIOR_EDITOR") && status === "PUBLISHED") {
      articleStatus = "PUBLISHED";
    }

    let finalSlug = slug;
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) finalSlug = `${slug}-${Date.now()}`;

    const article = await prisma.article.create({
      data: {
        title, slug: finalSlug, excerpt: autoExcerpt, content,
        featuredImage, featuredImageAlt, videoUrl,
        status: articleStatus,
        isFeatured: isFeatured || false,
        isTrending: isTrending || false,
        isBreaking: isBreaking || false,
        readTime,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || autoExcerpt,
        publishedAt: articleStatus === "PUBLISHED" ? new Date() : null,
        authorId: user.id,
        categoryId,
        tags: { create: tags.map((tagId: string) => ({ tagId })) },
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: true } },
      },
    });

    await prisma.activityLog.create({
      data: { action: "ARTICLE_CREATED", details: `Created article: ${title}`, userId: user.id },
    });

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch (error) {
    console.error("POST /api/articles error:", error);
    return NextResponse.json({ success: false, error: "Failed to create article" }, { status: 500 });
  }
}
