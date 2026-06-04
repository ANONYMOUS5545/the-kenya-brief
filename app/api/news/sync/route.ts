import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES,
  PUBLIC_NEWS_AUTHOR_NAME,
} from "@/lib/news-automation";
import { runNewsIngestion } from "@/lib/news-ingestion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runNewsIngestion();
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      author: PUBLIC_NEWS_AUTHOR_NAME,
      intervalMinutes: NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES,
      syncedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Manual news sync failed:", error);
    return NextResponse.json({ success: false, error: "Failed to run news sync" }, { status: 500 });
  }
}
