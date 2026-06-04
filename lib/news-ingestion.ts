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
const FEED_TIMEOUT_MS = 5000;
const MAX_ITEMS_PER_SOURCE = 30;
const MAX_IMPORTS_PER_RUN = 180;
const MAX_IMAGE_BACKFILLS_PER_SOURCE = 8;

const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  "Breaking News": { color: "#C8102E", icon: "B" },
  Politics: { color: "#B5001A", icon: "P" },
  Business: { color: "#0057A8", icon: "B" },
  Technology: { color: "#0B7FAB", icon: "T" },
  Sports: { color: "#168A3A", icon: "S" },
  Entertainment: { color: "#8A2BE2", icon: "E" },
  Health: { color: "#0F9D76", icon: "H" },
  Education: { color: "#7C3AED", icon: "E" },
  Environment: { color: "#15803D", icon: "N" },
  Counties: { color: "#EA580C", icon: "C" },
};

export const NEWS_SOURCES = [
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
  { name: "K24 Digital", feedUrl: "https://www.k24tv.co.ke/feed/" },
  { name: "NTV Kenya", feedUrl: "https://ntvkenya.co.ke/feed/" },
];

export type FeedItem = {
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
  author?: string;
  imageUrl?: string | null;
  imageCaption?: string | null;
  sourceName: string;
};

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function toPlainText(value: string) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? toPlainText(match[1]) : "";
}

function pickAttr(xml: string, tag: string, attr: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["'][^>]*>`, "i"));
  return match?.[1] ? decodeEntities(match[1]).trim() : "";
}

function pickImage(xml: string) {
  const enclosure = pickAttr(xml, "enclosure", "url");
  if (enclosure) return enclosure;

  const media = xml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (media?.[1]) return decodeEntities(media[1]).trim();

  const image = xml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return image?.[1] ? decodeEntities(image[1]).trim() : null;
}

function pickMetaImage(html: string) {
  const meta = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i);
  return meta?.[1] ? decodeEntities(meta[1]).trim() : null;
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function parseFeed(xml: string, sourceName: string): FeedItem[] {
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  return itemMatches
    .map((item) => {
      const title = pickTag(item, "title");
      const rssLink = pickTag(item, "link");
      const atomLink = pickAttr(item, "link", "href");
      const summary = pickTag(item, "description") || pickTag(item, "summary") || pickTag(item, "content:encoded");
      const dateText = pickTag(item, "pubDate") || pickTag(item, "published") || pickTag(item, "updated");
      const author = pickTag(item, "dc:creator") || pickTag(item, "author");
      const publishedAt = dateText ? new Date(dateText) : new Date();

      return {
        title,
        link: normalizeUrl(rssLink || atomLink),
        summary,
        publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
        author,
        imageUrl: pickImage(item),
        imageCaption: pickTag(item, "media:description") || pickTag(item, "media:title") || null,
        sourceName,
      };
    })
    .filter((item) => item.title && item.link);
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: { "User-Agent": "The Kenya Brief news aggregation bot" },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
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
  const meta = CATEGORY_META[name] || { color: "#C8102E", icon: name.charAt(0).toUpperCase() };

  return prisma.category.upsert({
    where: { slug },
    update: { name, isActive: true, sortOrder, color: meta.color, icon: meta.icon },
    create: { name, slug, isActive: true, sortOrder, color: meta.color, icon: meta.icon },
  });
}

async function uniqueSlug(title: string) {
  const base = slugify(title) || `kenya-brief-${Date.now()}`;
  const existing = await prisma.article.findUnique({ where: { slug: base } });
  return existing ? `${base}-${Date.now()}` : base;
}

async function logNewsAutomation(action: string, details: string, userId?: string) {
  console.info(`[${action}] ${details}`);

  try {
    await prisma.activityLog.create({ data: { action, details, userId } });
  } catch (error) {
    console.error("Unable to persist news automation log:", error);
  }
}

async function fetchSource(source: { name: string; feedUrl: string }) {
  const response = await fetchWithTimeout(source.feedUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const xml = await response.text();
  const items = parseFeed(xml, source.name).slice(0, MAX_ITEMS_PER_SOURCE);

  return Promise.all(items.map(async (item, index) => {
    if (item.imageUrl || index >= MAX_IMAGE_BACKFILLS_PER_SOURCE) return item;

    try {
      const articleResponse = await fetchWithTimeout(item.link);
      if (!articleResponse.ok) return item;
      const html = await articleResponse.text();
      const imageUrl = pickMetaImage(html);
      return imageUrl ? { ...item, imageUrl, imageCaption: item.imageCaption || `Image referenced from ${item.sourceName}.` } : item;
    } catch {
      return item;
    }
  }));
}

export async function fetchLatestNewsItems(limit = MAX_IMPORTS_PER_RUN) {
  const logs: string[] = [];
  let failed = 0;

  const fetchedSources = await Promise.all(
    NEWS_SOURCES.map(async (source) => {
      try {
        const items = await fetchSource(source);
        logs.push(`${source.name}: fetched ${items.length}`);
        return items;
      } catch (error) {
        failed += 1;
        logs.push(`${source.name}: failed - ${error instanceof Error ? error.message : "Unknown error"}`);
        return [];
      }
    })
  );

  const seen = new Set<string>();
  const items = fetchedSources
    .flat()
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .filter((item) => {
      const key = `${normalizeTitle(item.title)}:${item.publishedAt.toISOString().slice(0, 10)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  return { items, failed, logs };
}

export async function runNewsIngestion() {
  let author: Awaited<ReturnType<typeof ensureAutomationAuthor>>;

  try {
    author = await ensureAutomationAuthor();
  } catch (error) {
    console.error("News automation author unavailable:", error);
    throw error;
  }

  const categoryNames = Object.keys(CATEGORY_META);
  await Promise.all(categoryNames.map((name, index) => ensureCategory(name, index + 1)));

  const logs: string[] = [];
  const seenKeys = new Set<string>();
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  const latest = await fetchLatestNewsItems(MAX_IMPORTS_PER_RUN);
  failed = latest.failed;
  logs.push(...latest.logs);
  const items = latest.items;

  for (const item of items) {
    const title = createKenyaBriefTitle(item.title);
    const summary = createKenyaBriefSummary(item);
    const duplicateKey = `${normalizeTitle(title)}:${item.publishedAt.toISOString().slice(0, 10)}`;

    if (seenKeys.has(duplicateKey)) {
      skipped += 1;
      continue;
    }

    seenKeys.add(duplicateKey);

    const duplicate = await prisma.article.findFirst({
      where: {
        OR: [
          { sourceUrl: item.link },
          { title: { equals: title, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (duplicate) {
      skipped += 1;
      continue;
    }

    const category = await ensureCategory(classifyNewsCategory(item));
    const content = `<p>${summary}</p><p>This update was rewritten by The Kenya Brief from information first reported by ${item.sourceName}. Read the original report for full source context.</p>`;

    try {
      await prisma.article.create({
        data: {
          title,
          slug: await uniqueSlug(title),
          excerpt: summary,
          content,
          featuredImage: item.imageUrl || FALLBACK_IMAGE,
          featuredImageAlt: title,
          imageCaption: item.imageCaption || (item.imageUrl ? `Image referenced from ${item.sourceName}.` : null),
          imageCredit: item.imageUrl ? item.sourceName : null,
          sourceName: item.sourceName,
          sourceUrl: item.link,
          sourceAuthor: item.author || null,
          sourcePublishedAt: item.publishedAt,
          status: "PUBLISHED",
          isAutomated: true,
          isBreaking: category.name === "Breaking News",
          isTrending: false,
          isFeatured: imported < 3,
          readTime: estimateReadTime(content),
          metaTitle: title,
          metaDescription: summary,
          publishedAt: item.publishedAt,
          authorId: author.id,
          categoryId: category.id,
        },
      });

      imported += 1;
    } catch (error) {
      skipped += 1;
      logs.push(`${item.sourceName}: skipped create - ${error instanceof Error ? error.message : "Duplicate or invalid article"}`);
    }
  }

  const syncedAt = new Date().toISOString();
  await Promise.all([
    prisma.siteSettings.upsert({
      where: { key: "news_automation_last_sync" },
      update: { value: syncedAt },
      create: { key: "news_automation_last_sync", value: syncedAt },
    }),
    prisma.siteSettings.upsert({
      where: { key: "news_automation_last_import_count" },
      update: { value: String(imported) },
      create: { key: "news_automation_last_import_count", value: String(imported) },
    }),
  ]);

  await logNewsAutomation(
    failed ? "NEWS_AUTOMATION_SYNC_WITH_FAILURES" : "NEWS_AUTOMATION_SYNC",
    `Imported: ${imported}. Duplicates skipped: ${skipped}. Failed sources: ${failed}. ${logs.join(" | ")}`,
    author.id
  );

  return { imported, skipped, failed, logs };
}
