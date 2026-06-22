import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every 60 seconds for fresh breaking news

export async function GET() {
  try {
    // Fetch actual breaking news articles from database (more reliable than cache)
    const breakingArticles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        isBreaking: true,
        publishedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: { title: true },
    });

    const headlines = breakingArticles.map((item) => item.title);

    // Fallback if no breaking news found
    if (headlines.length === 0) {
      const latestArticles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 8,
        select: { title: true },
      });
      return NextResponse.json({
        success: true,
        headlines: latestArticles.map((item) => item.title),
        isBreaking: false,
      });
    }

    return NextResponse.json({ success: true, headlines, isBreaking: true });
  } catch (error) {
    console.error("Failed to fetch headlines:", error);
    return NextResponse.json(
      { success: true, headlines: ["Kenya Brief - Breaking News"], isBreaking: false },
      { status: 200 }
    );
  }
}
