import { prisma } from "@/lib/prisma";
import { estimateReadTime, slugify } from "@/lib/utils";
import {
  NEWS_AUTOMATION_AUTHOR_EMAIL,
  PUBLIC_NEWS_AUTHOR_NAME,
  classifyNewsCategory,
  cleanNewsText,
  createKenyaBriefArticleContent,
  createKenyaBriefSummary,
  createKenyaBriefTitle,
  hasCorruptNewsText,
  hasFullArticleContext,
  hasUsableNewsText,
  sanitizeExistingArticleHtml,
} from "@/lib/news-automation";
import { writeNewsCache } from "@/lib/news-cache";
import { fetchAndCacheSeoTrends, scoreTextAgainstTrends, trendTerms } from "@/lib/seo-trends";

const FALLBACK_IMAGE = "/news-fallback.svg";
const FEED_TIMEOUT_MS = 5000;
const MAX_ITEMS_PER_SOURCE = 30;
const MAX_IMPORTS_PER_RUN = 180;
const MAX_ARTICLE_PAGE_FETCHES_PER_SOURCE = 18;
const CURATED_AUTOMATED_SLUGS = new Set([
  "the-polygamist-netflix-trending-kenya",
  "top-50-influential-kenyans-2026",
  "best-smes-in-kenya-nairobi-2026",
]);

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
  Lifestyle: { color: "#DB2777", icon: "L" },
  World: { color: "#4B5563", icon: "W" },
};

export const NEWS_SOURCES = [
  { name: "The Standard", feedUrl: "https://www.standardmedia.co.ke/rss/headlines.php" },
  { name: "Citizen Digital", feedUrl: "https://www.citizen.digital/rss" },
  { name: "Capital FM", feedUrl: "https://www.capitalfm.co.ke/news/feed/" },
  { name: "KBC", feedUrl: "https://www.kbc.co.ke/feed/" },
  { name: "People Daily", feedUrl: "https://peopledaily.digital/feed" },
  { name: "Kenyans.co.ke", feedUrl: "https://www.kenyans.co.ke/rss.xml" },
  { name: "Eastleigh Voice", feedUrl: "https://eastleighvoice.co.ke/rss" },
  { name: "K24 Digital", feedUrl: "https://www.k24tv.co.ke/feed/" },
  { name: "NTV Kenya", feedUrl: "https://ntvkenya.co.ke/feed/" },
  { name: "Formula 1", feedUrl: "https://www.formula1.com/en/latest/all.xml" },
  { name: "BBC Football", feedUrl: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
];

export type FeedItem = {
  title: string;
  link: string;
  summary: string;
  bodyText?: string | null;
  publishedAt: Date;
  author?: string;
  imageUrl?: string | null;
  imageCaption?: string | null;
  sourceName: string;
};

type NewsSource = { name: string; feedUrl: string };

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
  return cleanNewsText(decodeEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " "));
}

function pickTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? toPlainText(match[1]) : "";
}

function pickRawTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ? decodeEntities(match[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
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

function pickArticleBody(html: string) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const paragraphs = [...cleaned.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .map((match) => toPlainText(match[1]))
    .filter((text) =>
      text.length > 60
      && !/subscribe|sign in|advertisement|newsletter|copyright|all rights reserved|cookies|top stories today|receive breaking stories|directly on your device|also read|related stories/i.test(text)
    );

  return paragraphs.slice(0, 9).join("\n\n").slice(0, 5000).trim();
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
      const rssLink = pickRawTag(item, "link");
      const atomLink = pickAttr(item, "link", "href");
      const summary = pickTag(item, "description") || pickTag(item, "summary") || pickTag(item, "content:encoded");
      const dateText = pickRawTag(item, "pubDate") || pickRawTag(item, "published") || pickRawTag(item, "updated");
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
    .filter((item) => hasUsableNewsText(item.title, 6) && item.link);
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

function rankingParagraphs(title: string, intro: string, sections: string[]) {
  return [
    `<p>${intro}</p>`,
    ...sections.map((section) => `<p>${section}</p>`),
    "<blockquote>Reference pool: Kenyans.co.ke public profiles and news pages are reviewed alongside Google Trends Kenya, Google News Kenya, official company pages, public filings, credible publisher reports, and verified public records.</blockquote>",
    `<p>This annual listing is reviewed for search interest, public relevance, visibility, and reader usefulness. It is designed as a living editorial guide rather than a paid placement.</p>`,
  ].join("");
}

async function ensureSpecialTrendStories(authorId: string) {
  const entertainmentCategory = await ensureCategory("Entertainment");
  const publishedAt = new Date("2026-06-20T09:00:00.000Z");
  const stories = [
    {
      title: "The Polygamist on Netflix: Why the South African Drama Is Trending in Kenya",
      slug: "the-polygamist-netflix-trending-kenya",
      excerpt: "The Polygamist is trending in Kenya because viewers are watching a South African Netflix drama about power, marriage, betrayal, and the cost of hidden secrets.",
      content: [
        "<p>The Polygamist is trending in Kenya because it has become one of the most searched Netflix drama titles, with audiences responding to its mix of family tension, romance, secrecy, and social power.</p>",
        "<p>The series is a South African drama based on Sue Nyathi's novel. It follows Jonasi Gomora, a wealthy businessman whose private life begins to unravel as his relationships with several women pull him into a web of lies, resentment, and emotional damage.</p>",
        "<p>What makes the story resonate is that it is not only about romance. The drama also explores ambition, reputation, gender expectations, and the consequences of trying to protect a perfect public image while hiding painful truths.</p>",
        "<p>For many Kenyan viewers, the interest is also about the way the show fits current conversation around streaming culture, cast buzz, and binge-worthy storytelling. In short, The Polygamist is trending because it combines a familiar family drama with sharp themes that feel personal, social, and highly relatable.</p>",
      ].join(""),
      sourceName: "Netflix Tudum / Google Trends",
      sourceUrl: "https://www.netflix.com/tudum/top10/kenya/tv",
    },
  ];

  let published = 0;

  for (const story of stories) {
    const existing = await prisma.article.findUnique({ where: { slug: story.slug }, select: { id: true } });
    if (existing) continue;

    await prisma.article.create({
      data: {
        title: story.title,
        slug: story.slug,
        excerpt: story.excerpt,
        content: story.content,
        featuredImage: FALLBACK_IMAGE,
        featuredImageAlt: story.title,
        imageCaption: "Kenya Brief entertainment trend artwork.",
        imageCredit: PUBLIC_NEWS_AUTHOR_NAME,
        sourceName: story.sourceName,
        sourceUrl: story.sourceUrl,
        status: "PUBLISHED",
        isAutomated: true,
        isBreaking: false,
        isTrending: true,
        isFeatured: false,
        readTime: estimateReadTime(story.content),
        metaTitle: story.title,
        metaDescription: story.excerpt,
        publishedAt,
        authorId,
        categoryId: entertainmentCategory.id,
      },
    });
    published += 1;
  }

  return published;
}

async function ensureAnnualRankingArticles(authorId: string) {
  const year = new Date().getFullYear();
  const rankingCategory = await ensureCategory("Business");
  const lifestyleCategory = await ensureCategory("Lifestyle");
  const publishedAt = new Date(`${year}-01-15T08:00:00.000Z`);
  const listings = [
    {
      title: `Top 50 Influential Kenyans ${year}: Leaders, Entrepreneurs, Athletes and Creators to Watch`,
      slug: `top-50-influential-kenyans-${year}`,
      excerpt: `An annual Kenya Brief ranking of influential Kenyans shaping politics, business, technology, sport, culture, public service, and civic life in ${year}.`,
      content: rankingParagraphs(
        `Top 50 Influential Kenyans ${year}`,
        `The Top 50 Influential Kenyans ${year} list highlights people whose decisions, work, platforms, institutions, and public visibility shape conversations across Kenya.`,
        [
          "The ranking looks across public leadership, entrepreneurship, technology, sports, entertainment, civil society, media, academia, and community impact.",
          "Readers searching for influential Kenyans, famous Kenyans, Kenyan leaders, Kenyan entrepreneurs, and people shaping Kenya can use this page as a broad annual guide.",
          "The final ordering should be reviewed by editors before publication updates, with entries supported by public achievements and verifiable context.",
        ]
      ),
      categoryId: lifestyleCategory.id,
      isFeatured: false,
      isTrending: true,
    },
    {
      title: `Best SMEs in Kenya and Nairobi ${year}: Top Small Businesses, Startups and Local Brands`,
      slug: `best-smes-in-kenya-nairobi-${year}`,
      excerpt: `An annual guide to standout SMEs in Kenya and Nairobi, covering small businesses, startups, local brands, service firms, retailers, and fast-growing founders.`,
      content: rankingParagraphs(
        `Best SMEs in Kenya and Nairobi ${year}`,
        `The Best SMEs in Kenya and Nairobi ${year} guide is built for readers searching for strong small businesses, local brands, startups, and service providers.`,
        [
          "The listing covers SMEs across retail, food, logistics, professional services, manufacturing, creative businesses, technology, agribusiness, and neighborhood services.",
          "Selection signals include customer relevance, local visibility, innovation, founder credibility, employment contribution, consistency, and public reputation.",
          "Editors can update this annual page with verified nominees, city-specific sections, and category rankings as more data becomes available.",
        ]
      ),
      categoryId: rankingCategory.id,
      isFeatured: false,
      isTrending: true,
    },
  ];

  let published = 0;

  for (const listing of listings) {
    const existing = await prisma.article.findUnique({ where: { slug: listing.slug }, select: { id: true } });
    if (existing) continue;

    await prisma.article.create({
      data: {
        title: listing.title,
        slug: listing.slug,
        excerpt: listing.excerpt,
        content: listing.content,
        featuredImage: FALLBACK_IMAGE,
        featuredImageAlt: listing.title,
        imageCaption: "Kenya Brief annual listing artwork.",
        imageCredit: PUBLIC_NEWS_AUTHOR_NAME,
        status: "PUBLISHED",
        isAutomated: true,
        isBreaking: false,
        isTrending: listing.isTrending,
        isFeatured: listing.isFeatured,
        readTime: estimateReadTime(listing.content),
        metaTitle: listing.title,
        metaDescription: listing.excerpt,
        publishedAt,
        authorId,
        categoryId: listing.categoryId,
      },
    });
    published += 1;
  }

  return published;
}

async function repairExistingAutomatedArticles() {
  const articles = await prisma.article.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, excerpt: true, content: true, featuredImage: true },
    take: 500,
  });
  let cleaned = 0;
  let archived = 0;

  for (const article of articles) {
    const repairedContent = sanitizeExistingArticleHtml(article.content);
    const hasReferencedImage = Boolean(article.featuredImage && article.featuredImage !== FALLBACK_IMAGE);
    const hasCleanTitle = hasUsableNewsText(article.title, 8) && !hasCorruptNewsText(article.title);
    const hasCleanExcerpt = !article.excerpt || (hasUsableNewsText(article.excerpt, 30) && !hasCorruptNewsText(article.excerpt));

    if ((!repairedContent || !hasReferencedImage || !hasCleanTitle || !hasCleanExcerpt) && !CURATED_AUTOMATED_SLUGS.has(article.slug)) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          status: "ARCHIVED",
          rejectionReason: "Archived automatically because the imported article had corrupted text, insufficient clean publisher context, or no referenced publisher image.",
        },
      });
      archived += 1;
      continue;
    }

    if (!repairedContent) continue;

    if (repairedContent !== article.content) {
      await prisma.article.update({
        where: { id: article.id },
        data: { content: repairedContent, readTime: estimateReadTime(repairedContent) },
      });
      cleaned += 1;
    }
  }

  return { cleaned, archived };
}

async function fetchSource(source: NewsSource) {
  const response = await fetchWithTimeout(source.feedUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const xml = await response.text();
  const items = parseFeed(xml, source.name).slice(0, MAX_ITEMS_PER_SOURCE);

  return Promise.all(items.map(async (item, index) => {
    if (index >= MAX_ARTICLE_PAGE_FETCHES_PER_SOURCE) return item;

    try {
      const articleResponse = await fetchWithTimeout(item.link);
      if (!articleResponse.ok) return item;
      const html = await articleResponse.text();
      const imageUrl = pickMetaImage(html);
      const bodyText = pickArticleBody(html);
      return {
        ...item,
        summary: hasUsableNewsText(item.summary, 50) ? item.summary : bodyText || item.summary,
        bodyText: hasUsableNewsText(bodyText, 160) ? bodyText : item.bodyText,
        imageUrl: imageUrl || item.imageUrl,
        imageCaption: item.imageCaption || ((imageUrl || item.imageUrl) ? `Photo: ${item.sourceName}` : null),
      };
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
    .filter((item) => hasFullArticleContext(item))
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
  const [latest, seoTrends] = await Promise.all([
    fetchLatestNewsItems(MAX_IMPORTS_PER_RUN),
    fetchAndCacheSeoTrends(),
  ]);
  const searchTerms = trendTerms(seoTrends);
  await writeNewsCache(latest.items);

  let author: Awaited<ReturnType<typeof ensureAutomationAuthor>>;

  try {
    author = await ensureAutomationAuthor();
  } catch (error) {
    console.error("News automation author unavailable:", error);
    return {
      imported: 0,
      skipped: 0,
      failed: latest.failed,
      cached: latest.items.length,
      trends: searchTerms.slice(0, 12),
      logs: [...latest.logs, "Database unavailable: stored fetched news in local cache only"],
    };
  }

  const categoryNames = Object.keys(CATEGORY_META);
  await Promise.all(categoryNames.map((name, index) => ensureCategory(name, index + 1)));
  const repairedArticles = await repairExistingAutomatedArticles().catch((error) => {
    console.error("Automated article repair failed:", error);
    return { cleaned: 0, archived: 0 };
  });

  const logs: string[] = [];
  const seenKeys = new Set<string>();
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  failed = latest.failed;
  logs.push(...latest.logs);
  const items = latest.items;

  for (const item of items) {
    const title = createKenyaBriefTitle(item, searchTerms);
    const summary = createKenyaBriefSummary(item);
    const duplicateKey = `${normalizeTitle(title)}:${item.publishedAt.toISOString().slice(0, 10)}`;
    const trendScore = scoreTextAgainstTrends(`${item.title} ${item.summary} ${item.bodyText || ""}`, seoTrends);

    if (!hasUsableNewsText(title, 8) || !hasUsableNewsText(summary, 30)) {
      skipped += 1;
      continue;
    }

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
    const content = createKenyaBriefArticleContent(item);
    if (!content) {
      skipped += 1;
      continue;
    }

    try {
      await prisma.article.create({
        data: {
          title,
          slug: await uniqueSlug(title),
          excerpt: summary,
          content,
          featuredImage: item.imageUrl || FALLBACK_IMAGE,
          featuredImageAlt: title,
          imageCaption: item.imageCaption || (item.imageUrl ? `Photo: ${item.sourceName}` : "Kenya Brief fallback image."),
          imageCredit: item.imageUrl ? item.sourceName : PUBLIC_NEWS_AUTHOR_NAME,
          sourceName: item.sourceName,
          sourceUrl: item.link,
          sourceAuthor: item.author || null,
          sourcePublishedAt: item.publishedAt,
          status: "PUBLISHED",
          isAutomated: true,
          isBreaking: category.name === "Breaking News",
          isTrending: trendScore > 0,
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

  const annualRankingsPublished = await ensureAnnualRankingArticles(author.id).catch((error) => {
    logs.push(`Annual rankings: failed - ${error instanceof Error ? error.message : "Unknown error"}`);
    return 0;
  });
  const specialStoriesPublished = await ensureSpecialTrendStories(author.id).catch((error) => {
    logs.push(`Special stories: failed - ${error instanceof Error ? error.message : "Unknown error"}`);
    return 0;
  });

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
    `Imported: ${imported}. Existing automated articles cleaned: ${repairedArticles.cleaned}. Existing automated articles archived: ${repairedArticles.archived}. Annual rankings published: ${annualRankingsPublished}. Special stories published: ${specialStoriesPublished}. Duplicates skipped: ${skipped}. Failed sources: ${failed}. SEO trends used: ${searchTerms.slice(0, 8).join(", ") || "none"}. ${logs.join(" | ")}`,
    author.id
  );

  return { imported, repairedArticles, annualRankingsPublished, specialStoriesPublished, skipped, failed, trends: searchTerms.slice(0, 12), logs };
}
