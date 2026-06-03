import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runNewsIngestion } from "@/lib/news-ingestion";
import { NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES } from "@/lib/news-automation";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.siteSettings.findMany({
    where: { key: { in: ["news_automation_enabled", "news_automation_last_sync"] } },
  }).catch(() => []);
  const map = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));

  if (map.news_automation_enabled === "false") {
    return NextResponse.json({ success: true, skipped: true, reason: "disabled" });
  }

  const lastSync = map.news_automation_last_sync ? new Date(map.news_automation_last_sync) : null;
  const minAgeMs = NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES * 60 * 1000;

  if (lastSync && Date.now() - lastSync.getTime() < minAgeMs) {
    return NextResponse.json({ success: true, skipped: true, reason: "fresh" });
  }

  const result = await runNewsIngestion();
  return NextResponse.json({ success: true, ...result });
}
