import type { ArticleWithRelations, CategoryWithCount } from "@/types";
import { estimateReadTime, slugify } from "@/lib/utils";
import { classifyNewsCategory, createKenyaBriefSummary, createKenyaBriefTitle } from "@/lib/news-automation";
import { fetchLatestNewsItems, type FeedItem } from "@/lib/news-ingestion";

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
};

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
  const content = `<p>${summary}</p><p>This story was rewritten by The Kenya Brief from information first reported by ${item.sourceName}.</p>`;

  return {
    id: `live-${slugify(item.link || title)}`,
    title,
    slug: slugify(title),
    excerpt: summary,
    content,
    featuredImage: item.imageUrl || null,
    featuredImageAlt: title,
    imageCaption: item.imageCaption || (item.imageUrl ? `Image referenced from ${item.sourceName}.` : null),
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

export async function getLiveFallbackHomeData() {
  const { items } = await fetchLatestNewsItems(120);
  const articles = items.map(liveArticleFromFeedItem);
  const counts = new Map<string, number>();

  articles.forEach((article) => {
    counts.set(article.category.slug, (counts.get(article.category.slug) || 0) + 1);
  });

  const categories: CategoryWithCount[] = Array.from(counts.entries()).map(([slug, count], index) => {
    const article = articles.find((item) => item.category.slug === slug);
    return {
      id: article?.category.id || `live-${slug}`,
      name: article?.category.name || slug,
      slug,
      color: article?.category.color || "#C8102E",
      icon: article?.category.name?.[0] || "N",
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

export async function getLiveFallbackArticle(slug: string) {
  const { items } = await fetchLatestNewsItems(160);
  return items.map(liveArticleFromFeedItem).find((item) => item.slug === slug) || null;
}
