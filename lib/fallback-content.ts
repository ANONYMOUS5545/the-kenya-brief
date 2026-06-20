import type { ArticleWithRelations, CategoryWithCount } from "@/types";

const now = new Date("2026-06-03T12:00:00.000Z");

export const fallbackCategories: CategoryWithCount[] = [
  { id: "fallback-politics", name: "Politics", slug: "politics", color: "#B5001A", icon: "P", _count: { articles: 3 } },
  { id: "fallback-business", name: "Business", slug: "business", color: "#0057A8", icon: "B", _count: { articles: 3 } },
  { id: "fallback-sports", name: "Sports", slug: "sports", color: "#168A3A", icon: "S", _count: { articles: 2 } },
  { id: "fallback-entertainment", name: "Entertainment", slug: "entertainment", color: "#8A2BE2", icon: "E", _count: { articles: 2 } },
  { id: "fallback-technology", name: "Technology", slug: "technology", color: "#0B7FAB", icon: "T", _count: { articles: 2 } },
  { id: "fallback-health", name: "Health", slug: "health", color: "#0F9D76", icon: "H", _count: { articles: 1 } },
  { id: "fallback-world", name: "World", slug: "world", color: "#4B5563", icon: "W", _count: { articles: 1 } },
];

const author = { id: "fallback-author", name: "Kenya Brief Desk", image: null };

function category(slug: string) {
  const found = fallbackCategories.find((item) => item.slug === slug) || fallbackCategories[0];
  return {
    id: found.id,
    name: found.name,
    slug: found.slug,
    color: found.color,
  };
}

function article(
  id: string,
  title: string,
  slug: string,
  categorySlug: string,
  excerpt: string,
  flags: Partial<Pick<ArticleWithRelations, "isFeatured" | "isTrending" | "isBreaking" | "viewCount">> = {},
  content?: string
): ArticleWithRelations {
  return {
    id,
    title,
    slug,
    excerpt,
    content: content || [
      `<p>${excerpt}</p>`,
      "<p>The story is presented as part of The Kenya Brief's curated coverage for readers following major developments across Kenya and the region.</p>",
      "<p>Editors group this article by topic so readers can follow related coverage, background and future updates in the same section.</p>",
      "<p>Further verified details can be added as reporting develops and credible source material becomes available.</p>",
    ].join(""),
    featuredImage: "/news-fallback.svg",
    featuredImageAlt: title,
    videoUrl: null,
    status: "PUBLISHED",
    isFeatured: flags.isFeatured ?? false,
    isTrending: flags.isTrending ?? false,
    isBreaking: flags.isBreaking ?? false,
    viewCount: flags.viewCount ?? 1200,
    readTime: 3,
    publishedAt: now,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
    author,
    category: category(categorySlug),
    tags: [],
    _count: { comments: 0 },
  };
}

export const fallbackArticles: ArticleWithRelations[] = [
  article(
    "fallback-1",
    "President announces new measures as cost of living talks intensify",
    "cost-of-living-talks-intensify",
    "politics",
    "Government leaders are under pressure to explain new fiscal measures as households demand relief on essential goods.",
    { isFeatured: true, isBreaking: true, viewCount: 5840 }
  ),
  article(
    "fallback-2",
    "Kenya shilling steadies as markets await Central Bank signal",
    "kenya-shilling-steadies-markets-await-central-bank",
    "business",
    "Currency traders say improved dollar inflows and cautious demand have helped steady the shilling in early week trading.",
    { isFeatured: true, isTrending: true, viewCount: 4210 }
  ),
  article(
    "fallback-3",
    "Harambee Stars prepare for decisive qualifier in Nairobi",
    "harambee-stars-decisive-qualifier-nairobi",
    "sports",
    "The national team is expected to name a strong squad as fans prepare for a sold-out qualifier at Kasarani.",
    { isFeatured: true, isTrending: true, viewCount: 3910 }
  ),
  article(
    "fallback-4",
    "Nairobi tech firms expand hiring despite tighter funding climate",
    "nairobi-tech-firms-expand-hiring",
    "technology",
    "Several software and payments companies are still hiring engineers, product managers, and data specialists.",
    { isTrending: true, viewCount: 2980 }
  ),
  article(
    "fallback-5",
    "Hospitals brace for new health fund registration deadline",
    "hospitals-health-fund-registration-deadline",
    "health",
    "County hospitals are preparing help desks as the government pushes citizens to complete health fund registration.",
    { viewCount: 2640 }
  ),
  article(
    "fallback-6",
    "Local creators dominate streaming charts with new releases",
    "local-creators-dominate-streaming-charts",
    "entertainment",
    "Kenyan musicians and filmmakers are posting strong streaming numbers as audiences embrace homegrown stories.",
    { viewCount: 2190 }
  ),
  article(
    "fallback-polygamist",
    "The Polygamist on Netflix: Why the South African drama is trending in Kenya",
    "the-polygamist-netflix-trending-kenya",
    "entertainment",
    "The Polygamist is drawing Kenyan search interest as viewers debate the Netflix drama's story of love, betrayal, family secrets and power.",
    { isTrending: true, viewCount: 3360 },
    [
      "<p>The Polygamist is trending in Kenya as viewers search for details about the South African Netflix drama and its story of love, betrayal, family secrets and power.</p>",
      "<p>The drama follows a wealthy businessman whose private relationships begin to collide with his public image, creating tension around marriage, trust and the consequences of hidden choices.</p>",
      "<p>The show belongs in Entertainment because the strongest reader interest is around streaming culture, Netflix rankings, cast conversation, viewer reaction and African television storytelling.</p>",
      "<p>Kenyan search interest around The Polygamist points to a wider appetite for African dramas that mix domestic conflict with questions about reputation, ambition and accountability.</p>",
    ].join("")
  ),
  article(
    "fallback-7",
    "Regional leaders meet over cross-border trade and security",
    "regional-leaders-cross-border-trade-security",
    "world",
    "East African leaders are expected to review trade corridors, border security, and infrastructure priorities.",
    { viewCount: 1870 }
  ),
  article(
    "fallback-8",
    "Small businesses turn to digital payments ahead of tax changes",
    "small-businesses-digital-payments-tax-changes",
    "business",
    "Retailers say digital records are becoming essential as compliance rules become stricter across the sector.",
    { viewCount: 1740 }
  ),
  article(
    "fallback-top-50-kenyans",
    "Top 50 Influential Kenyans 2026: Leaders, Entrepreneurs, Athletes and Creators to Watch",
    "top-50-influential-kenyans-2026",
    "entertainment",
    "An annual ranking of influential Kenyans shaping politics, business, technology, sport, culture, public service and civic life.",
    { isTrending: true, viewCount: 4520 },
    [
      "<p>The Top 50 Influential Kenyans 2026 listing highlights public figures, entrepreneurs, athletes, creators and civic voices shaping national conversation.</p>",
      "<p>The ranking is designed for readers searching for influential Kenyans, famous Kenyans, Kenyan leaders, Kenyan entrepreneurs and people shaping Kenya in 2026.</p>",
      "<p>Selection signals include public visibility, verified achievements, institutional influence, cultural impact, business relevance and contribution to civic life.</p>",
      "<blockquote>Reference pool: Kenyans.co.ke public profiles and news pages are reviewed alongside Google Trends Kenya, Google News Kenya, official company pages, credible publisher reports and verified public records.</blockquote>",
      "<p>The list should be reviewed and updated through the year as new achievements, leadership changes and public-interest developments emerge.</p>",
    ].join("")
  ),
  article(
    "fallback-best-smes",
    "Best SMEs in Kenya and Nairobi 2026: Top Small Businesses, Startups and Local Brands",
    "best-smes-in-kenya-nairobi-2026",
    "business",
    "An annual guide to standout SMEs in Kenya and Nairobi, covering small businesses, startups, local brands and fast-growing founders.",
    { isTrending: true, viewCount: 3940 },
    [
      "<p>The Best SMEs in Kenya and Nairobi 2026 guide is built for readers looking for strong small businesses, startups, local brands and service providers.</p>",
      "<p>The listing covers businesses across retail, food, logistics, professional services, manufacturing, creative work, technology, agribusiness and neighborhood services.</p>",
      "<p>Selection signals include customer relevance, local visibility, innovation, founder credibility, employment contribution, consistency and public reputation.</p>",
      "<blockquote>Reference pool: Kenyans.co.ke business and people coverage is reviewed alongside Google Trends Kenya, Google News Kenya, company websites, county business records, founder pages and credible publisher reports.</blockquote>",
      "<p>Editors can update the guide with verified nominees, city-specific sections and category rankings as more reliable business data becomes available.</p>",
    ].join("")
  ),
];

export function getFallbackHomeData() {
  return {
    featured: fallbackArticles.filter((item) => item.isFeatured),
    trending: fallbackArticles.filter((item) => item.isTrending),
    breaking: fallbackArticles.filter((item) => item.isBreaking),
    latestByCategory: fallbackArticles,
    categories: fallbackCategories,
  };
}
