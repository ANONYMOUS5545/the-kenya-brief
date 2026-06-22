import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch actual breaking news articles from database (most recent breaking news first)
    const breakingArticles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        isBreaking: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: { title: true },
    });

    const headlines = breakingArticles.map((item) => item.title);

    // If we have breaking news, return it
    if (headlines.length > 0) {
      return NextResponse.json(
        { success: true, headlines, isBreaking: true },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
        }
      );
    }

    // Fallback to latest articles if no breaking news found
    const latestArticles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: { title: true },
    });

    return NextResponse.json(
      {
        success: true,
        headlines: latestArticles.map((item) => item.title),
        isBreaking: false,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch headlines:", error);
    return NextResponse.json(
      { success: true, headlines: ["Kenya Brief - Latest Breaking News"], isBreaking: false },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  }
}
