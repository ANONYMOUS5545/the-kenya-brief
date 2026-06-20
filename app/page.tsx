export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { readSeoTrendCache, trendTerms } from "@/lib/seo-trends";

export async function generateMetadata(): Promise<Metadata> {
  const trends = trendTerms(await readSeoTrendCache()).slice(0, 12);
  const trendKeywords = trends.length ? trends : ["Kenya news", "breaking news Kenya", "Nairobi news"];

  return {
    title: "Kenya News Today, Breaking Stories and Trending Searches",
    description: `Latest Kenya news, breaking stories and trending topics people are searching for: ${trendKeywords.slice(0, 6).join(", ")}.`,
    keywords: ["Kenya news", "breaking news Kenya", "trending news Kenya", "Google Trends Kenya", ...trendKeywords],
  };
}

export { default } from "@/components/home/HomePage";
