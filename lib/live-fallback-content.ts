import type { ArticleWithRelations, CategoryWithCount } from "@/types";
import { estimateReadTime, slugify } from "@/lib/utils";
import { classifyNewsCategory, createKenyaBriefArticleContent, createKenyaBriefSummary, createKenyaBriefTitle } from "@/lib/news-automation";
import { readNewsCache } from "@/lib/news-cache";
import type { FeedItem } from "@/lib/news-ingestion";

const author = { id: "live-news-author", name: "Kenya Brief", image: null };
const categoryColors: Record<string, string> = {
  "Breaking News": "#C8102E",
  Politics: "#B5001A",
  Business: "#0057A8",
  Technology: "#0B7FAB",
  Sports: "#168A3A",
  Entertainment: "#8A2BE2",
  Health: "#0F9D76",
  Education: "#7C3AED",
  Environment: "#15803D",
  Counties: "#EA580C",
  Lifestyle: "#DB2777",
  World: "#4B5563",
};
const defaultCategoryNames = [
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
  "Lifestyle",
  "World",
];
const homeCategoryOrder = [
  "Breaking News",
  "Politics",
  "Business",
  "Counties",
  "Health",
  "Education",
  "Environment",
  "Technology",
  "Sports",
  "Entertainment",
  "Lifestyle",
  "World",
];
let homeDataCache: { data: Awaited<ReturnType<typeof buildLiveFallbackHomeData>>; loadedAt: number } | null = null;
const HOME_DATA_TTL_MS = 60_000;

function categoryFor(item: FeedItem) {
  const name = classifyNewsCategory(item);
  return {
    id: `live-${slugify(name)}`,
    name,
    slug: slugify(name),
    color: categoryColors[name] || "#C8102E",
  };
}

export function liveArticleFromFeedItem(item: FeedItem, index = 0): ArticleWithRelations {
  const title = createKenyaBriefTitle(item.title);
  const summary = createKenyaBriefSummary(item);
  const category = categoryFor(item);
  const content = createKenyaBriefArticleContent(item);

  return {
    id: `live-${slugify(item.link || title)}`,
    title,
    slug: slugify(title),
    excerpt: summary,
    content,
    featuredImage: item.imageUrl || null,
    featuredImageAlt: title,
    imageCaption: item.imageCaption || (item.imageUrl ? `Photo: ${item.sourceName}.` : null),
    imageCredit: item.imageUrl ? item.sourceName : null,
    sourceName: item.sourceName,
    sourceUrl: item.link,
    sourceAuthor: item.author || null,
    sourcePublishedAt: item.publishedAt,
    isAutomated: true,
    status: "PUBLISHED",
    isFeatured: index < 5,
    isTrending: index >= 5 && index < 12,
    isBreaking: category.name === "Breaking News" || index < 3,
    viewCount: 1000 + index * 137,
    readTime: estimateReadTime(content),
    publishedAt: item.publishedAt,
    rejectionReason: null,
    createdAt: item.publishedAt,
    updatedAt: item.publishedAt,
    author,
    category,
    tags: [],
    _count: { comments: 0 },
  };
}

function balanceArticlesForHome(articles: ArticleWithRelations[]) {
  const buckets = new Map<string, ArticleWithRelations[]>();
  articles.forEach((article) => {
    const slug = article.category.slug;
    buckets.set(slug, [...(buckets.get(slug) || []), article]);
  });

  const ordered: ArticleWithRelations[] = [];
  const seen = new Set<string>();
  const categorySlugs = homeCategoryOrder.map(slugify);

  while (ordered.length < articles.length) {
    let added = false;

    for (const slug of categorySlugs) {
      const next = buckets.get(slug)?.shift();
      if (next && !seen.has(next.id)) {
        ordered.push(next);
        seen.add(next.id);
        added = true;
      }
    }

    if (!added) break;
  }

  articles.forEach((article) => {
    if (!seen.has(article.id)) ordered.push(article);
  });

  return ordered.map((article, index) => ({
    ...article,
    isFeatured: index < 5,
    isTrending: index >= 5 && index < 12,
    isBreaking: article.category.name === "Breaking News" || index < 3,
  }));
}

async function buildLiveFallbackHomeData() {
  const items = (await readNewsCache()).slice(0, 180);
  const allArticles = items.map(liveArticleFromFeedItem);
  const articles = balanceArticlesForHome(allArticles);
  const counts = new Map<string, number>();

  allArticles.forEach((article) => {
    counts.set(article.category.slug, (counts.get(article.category.slug) || 0) + 1);
  });

  defaultCategoryNames.forEach((name) => {
    const slug = slugify(name);
    if (!counts.has(slug)) counts.set(slug, 0);
  });

  const categories: CategoryWithCount[] = Array.from(counts.entries()).map(([slug, count]) => {
    const article = allArticles.find((item) => item.category.slug === slug);
    const name = article?.category.name || defaultCategoryNames.find((item) => slugify(item) === slug) || slug;
    return {
      id: article?.category.id || `live-${slug}`,
      name,
      slug,
      color: article?.category.color || categoryColors[name] || "#C8102E",
      icon: name[0] || "N",
      _count: { articles: count },
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return {
    featured: articles.filter((item) => item.isFeatured),
    trending: articles.filter((item) => item.isTrending),
    breaking: articles.filter((item) => item.isBreaking).slice(0, 12),
    latestByCategory: articles,
    categories: categories.map((category, sortOrder) => ({ ...category, sortOrder })),
  };
}

export async function getLiveFallbackHomeData() {
  if (homeDataCache && Date.now() - homeDataCache.loadedAt < HOME_DATA_TTL_MS) {
    return homeDataCache.data;
  }

  const data = await buildLiveFallbackHomeData();
  homeDataCache = { data, loadedAt: Date.now() };
  return data;
}

export async function getLiveFallbackArticle(slug: string) {
  return (await readNewsCache()).map(liveArticleFromFeedItem).find((item) => item.slug === slug) || null;
}
