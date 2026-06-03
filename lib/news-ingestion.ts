import { prisma } from "@/lib/prisma";
import { estimateReadTime, slugify } from "@/lib/utils";
import {
  NEWS_AUTOMATION_AUTHOR_EMAIL,
  PUBLIC_NEWS_AUTHOR_NAME,
  classifyNewsCategory,
  createKenyaBriefSummary,
  createKenyaBriefTitle,
} from "@/lib/news-automation";

const FALLBACK_IMAGE = "/news-fallback.svg";

const NEWS_SOURCES = [
  { name: "Nation", feedUrl: "https://nation.africa/kenya/rss" },
  { name: "Business Daily", feedUrl: "https://www.businessdailyafrica.com/bd/rss" },
  { name: "The Standard", feedUrl: "https://www.standardmedia.co.ke/rss/headlines.php" },
  { name: "Citizen Digital", feedUrl: "https://www.citizen.digital/rss" },
  { name: "Capital FM", feedUrl: "https://www.capitalfm.co.ke/news/feed/" },
  { name: "KBC", feedUrl: "https://www.kbc.co.ke/feed/" },
  { name: "People Daily", feedUrl: "https://peopledaily.digital/feed" },
  { name: "Tuko", feedUrl: "https://www.tuko.co.ke/rss/all.xml" },
  { name: "Kenyans.co.ke", feedUrl: "https://www.kenyans.co.ke/rss.xml" },
  { name: "Eastleigh Voice", feedUrl: "https://eastleighvoice.co.ke/rss" },
  { name: "The Star", feedUrl: "https://www.the-star.co.ke/rss" },
];

type FeedItem = {
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
  author?: string;
  imageUrl?: string | null;
  imageCaption?: string | null;
  sourceName: string;
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function pickImage(xml: string) {
  const enclosure = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (enclosure?.[1]) return enclosure[1];
  const media = xml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["'][^>]*>/i);
  return media?.[1] || null;
}

function parseFeed(xml: string, sourceName: string): FeedItem[] {
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  return itemMatches
    .map((item) => {
      const title = pickTag(item, "title");
      const link = pickTag(item, "link") || item.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
      const summary = pickTag(item, "description") || pickTag(item, "summary") || pickTag(item, "content:encoded");
      const dateText = pickTag(item, "pubDate") || pickTag(item, "published") || pickTag(item, "updated");
      const author = pickTag(item, "dc:creator") || pickTag(item, "author");
      const publishedAt = dateText ? new Date(dateText) : new Date();

      return {
        title,
        link,
        summary,
        publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
        author,
        imageUrl: pickImage(item),
        imageCaption: pickTag(item, "media:description") || null,
        sourceName,
      };
    })
    .filter((item) => item.title && item.link);
}

async function ensureAutomationAuthor() {
  return prisma.user.upsert({
    where: { email: NEWS_AUTOMATION_AUTHOR_EMAIL },
    update: { name: PUBLIC_NEWS_AUTHOR_NAME, role: "SENIOR_EDITOR", isActive: true, isSuspended: false },
    create: {
      email: NEWS_AUTOMATION_AUTHOR_EMAIL,
      name: PUBLIC_NEWS_AUTHOR_NAME,
      role: "SENIOR_EDITOR",
      bio: "Automated Kenya Brief news desk account.",
    },
  });
}

async function ensureCategory(name: string, sortOrder = 99) {
  const slug = slugify(name);
  return prisma.category.upsert({
    where: { slug },
    update: { name, isActive: true, sortOrder },
    create: { name, slug, isActive: true, sortOrder },
  });
}

async function uniqueSlug(title: string) {
  const base = slugify(title) || `kenya-brief-${Date.now()}`;
  const existing = await prisma.article.findUnique({ where: { slug: base } });
  return existing ? `${base}-${Date.now()}` : base;
}

export async function runNewsIngestion() {
  const author = await ensureAutomationAuthor();
  const categoryNames = ["Breaking News", "Politics", "Business", "Technology", "Sports", "Entertainment", "Health", "Education", "Environment", "Counties"];

  await Promise.all(categoryNames.map((name, index) => ensureCategory(name, index + 1)));

  const logs: string[] = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const source of NEWS_SOURCES) {
    try {
      const response = await fetch(source.feedUrl, {
        headers: { "User-Agent": "The Kenya Brief news aggregation bot" },
        next: { revalidate: 240 },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const xml = await response.text();
      const items = parseFeed(xml, source.name).slice(0, 10);

      for (const item of items) {
        const duplicate = await prisma.article.findFirst({
          where: {
            OR: [
              { sourceUrl: item.link },
              { title: { equals: createKenyaBriefTitle(item.title), mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });

        if (duplicate) {
          skipped += 1;
          continue;
        }

        const title = createKenyaBriefTitle(item.title);
        const summary = createKenyaBriefSummary(item);
        const category = await ensureCategory(classifyNewsCategory(item));
        const content = `<p>${summary}</p>`;

        await prisma.article.create({
          data: {
            title,
            slug: await uniqueSlug(title),
            excerpt: summary,
            content,
            featuredImage: item.imageUrl || FALLBACK_IMAGE,
            featuredImageAlt: title,
            imageCaption: item.imageCaption,
            imageCredit: item.imageUrl ? item.sourceName : null,
            sourceName: item.sourceName,
            sourceUrl: item.link,
            sourceAuthor: item.author || null,
            sourcePublishedAt: item.publishedAt,
            status: "PUBLISHED",
            isAutomated: true,
            isBreaking: category.name === "Breaking News",
            isTrending: false,
            isFeatured: false,
            readTime: estimateReadTime(content),
            metaTitle: title,
            metaDescription: summary,
            publishedAt: item.publishedAt,
            authorId: author.id,
            categoryId: category.id,
          },
        });

        imported += 1;
      }

      logs.push(`${source.name}: imported ${imported}, skipped duplicates ${skipped}`);
    } catch (error) {
      failed += 1;
      logs.push(`${source.name}: failed - ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  await prisma.siteSettings.upsert({
    where: { key: "news_automation_last_sync" },
    update: { value: new Date().toISOString() },
    create: { key: "news_automation_last_sync", value: new Date().toISOString() },
  });
  await prisma.siteSettings.upsert({
    where: { key: "news_automation_last_import_count" },
    update: { value: String(imported) },
    create: { key: "news_automation_last_import_count", value: String(imported) },
  });

  await prisma.activityLog.create({
    data: {
      action: failed ? "NEWS_AUTOMATION_SYNC_WITH_FAILURES" : "NEWS_AUTOMATION_SYNC",
      details: `Imported: ${imported}. Duplicates skipped: ${skipped}. Failed sources: ${failed}. ${logs.join(" | ")}`,
      userId: author.id,
    },
  });

  return { imported, skipped, failed, logs };
}
