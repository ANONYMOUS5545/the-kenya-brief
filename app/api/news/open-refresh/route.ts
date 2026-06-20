import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runNewsIngestion } from "@/lib/news-ingestion";
import {
  NEWS_AUTOMATION_DEFAULT_CACHE_MINUTES,
  NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES,
} from "@/lib/news-automation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: ["news_automation_enabled", "news_automation_last_sync", "news_automation_cache_minutes"] } },
    }).catch(() => []);
    const map = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));

    if (map.news_automation_enabled === "false") {
      return NextResponse.json({ success: true, skipped: true, reason: "disabled" });
    }

    const configuredCache = Number.parseInt(map.news_automation_cache_minutes || "", 10);
    const cacheMinutes = Number.isFinite(configuredCache) && configuredCache > 0
      ? configuredCache
      : NEWS_AUTOMATION_DEFAULT_CACHE_MINUTES || NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES;
    const lastSync = map.news_automation_last_sync ? new Date(map.news_automation_last_sync) : null;
    const minAgeMs = cacheMinutes * 60 * 1000;

    if (lastSync && !Number.isNaN(lastSync.getTime()) && Date.now() - lastSync.getTime() < minAgeMs) {
      return NextResponse.json({ success: true, skipped: true, reason: "fresh", cacheMinutes });
    }

    const result = await runNewsIngestion();
    revalidatePath("/");
    revalidatePath("/search");

    return NextResponse.json({ success: true, cacheMinutes, ...result });
  } catch (error) {
    console.error("Open news refresh failed:", error);
    return NextResponse.json({ success: false, error: "Open refresh failed gracefully" }, { status: 200 });
  }
}
