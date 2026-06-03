import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  NEWS_AUTOMATION_AUTHOR_EMAIL,
  NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES,
  PUBLIC_NEWS_AUTHOR_NAME,
} from "@/lib/news-automation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const automationAuthor = await prisma.user.upsert({
      where: { email: NEWS_AUTOMATION_AUTHOR_EMAIL },
      update: { name: PUBLIC_NEWS_AUTHOR_NAME, role: "SENIOR_EDITOR", isActive: true, isSuspended: false },
      create: {
        email: NEWS_AUTOMATION_AUTHOR_EMAIL,
        name: PUBLIC_NEWS_AUTHOR_NAME,
        role: "SENIOR_EDITOR",
        bio: "Automated Kenya Brief news desk account.",
      },
    });

    const categoryNames = [
      "Breaking News",
      "Politics",
      "Business",
      "Technology",
      "Sports",
      "Entertainment",
      "Health",
      "Education",
      "Environment",
      "Counties",
    ];

    await Promise.all(
      categoryNames.map((name, index) => {
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        return prisma.category.upsert({
          where: { slug },
          update: { name, isActive: true, sortOrder: index + 1 },
          create: { name, slug, isActive: true, sortOrder: index + 1 },
        });
      })
    );

    await prisma.activityLog.create({
      data: {
        action: "NEWS_AUTOMATION_SYNC",
        userId: automationAuthor.id,
        details: `Scheduled news automation sync triggered. Interval: ${NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES} minutes. Public byline: ${PUBLIC_NEWS_AUTHOR_NAME}.`,
      },
    });

    return NextResponse.json({
      success: true,
      author: PUBLIC_NEWS_AUTHOR_NAME,
      intervalMinutes: NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES,
      syncedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to run news sync" }, { status: 500 });
  }
}
