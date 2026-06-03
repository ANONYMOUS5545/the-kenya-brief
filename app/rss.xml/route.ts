import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { category: { select: { name: true } } },
  }).catch(() => []);

  const items = articles.map((article) => {
    const url = `${siteUrl}/article/${article.slug}`;
    return `
      <item>
        <title>${escapeXml(article.title)}</title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${(article.publishedAt || article.createdAt).toUTCString()}</pubDate>
        <category>${escapeXml(article.category.name)}</category>
        <description>${escapeXml(article.excerpt || article.metaDescription || "")}</description>
      </item>`;
  }).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>The Kenya Brief</title>
        <link>${siteUrl}</link>
        <description>Latest Kenya news from The Kenya Brief.</description>
        <language>en-ke</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${items}
      </channel>
    </rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=240, stale-while-revalidate=600",
    },
  });
}
