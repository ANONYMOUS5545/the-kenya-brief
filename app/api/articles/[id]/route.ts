import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, estimateReadTime } from "@/lib/utils";

interface Params { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: true } },
        comments: {
          where: { status: "APPROVED", parentId: null },
          include: {
            user: { select: { id: true, name: true, image: true } },
            replies: {
              where: { status: "APPROVED" },
              include: { user: { select: { id: true, name: true, image: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { comments: true } },
      },
    });
    if (!article) {
      return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 });
    }
    await prisma.article.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    const session = await getServerSession(authOptions);
    const isEditor = session?.user && ["ADMIN", "SENIOR_EDITOR", "JUNIOR_EDITOR"].includes((session.user as { role?: string }).role || "");
    const data = isEditor ? article : (() => {
      const { sourceName, sourceUrl, sourceAuthor, sourcePublishedAt, ...safeArticle } = article;
      return safeArticle;
    })();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/articles/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch article" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const user = session.user as any;
    const body = await request.json();

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 });
    }

    const canEdit =
      user.role === "ADMIN" ||
      user.role === "SENIOR_EDITOR" ||
      (user.role === "JUNIOR_EDITOR" && article.authorId === user.id && article.status === "DRAFT");

    if (!canEdit) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const {
      title, excerpt, content, featuredImage, featuredImageAlt,
      videoUrl, categoryId, tags, isFeatured, isTrending, isBreaking,
      metaTitle, metaDescription, status, rejectionReason,
    } = body;

    let statusUpdate: string | undefined = status;
    if (status === "PUBLISHED" && !["ADMIN", "SENIOR_EDITOR"].includes(user.role)) {
      statusUpdate = undefined;
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) { updateData.title = title; updateData.slug = slugify(title); }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) { updateData.content = content; updateData.readTime = estimateReadTime(content); }
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isTrending !== undefined) updateData.isTrending = isTrending;
    if (isBreaking !== undefined) updateData.isBreaking = isBreaking;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (statusUpdate) {
      updateData.status = statusUpdate;
      if (statusUpdate === "PUBLISHED" && !article.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...updateData,
        ...(tags !== undefined && {
          tags: { deleteMany: {}, create: tags.map((tagId: string) => ({ tagId })) },
        }),
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "ARTICLE_UPDATED",
        details: `Updated article: ${updated.title} (status: ${updated.status})`,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/articles/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const user = session.user as any;
    if (!["ADMIN", "SENIOR_EDITOR"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Article deleted" });
  } catch (error) {
    console.error("DELETE /api/articles/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete article" }, { status: 500 });
  }
}
