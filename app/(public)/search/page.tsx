export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArticleCard from "@/components/article/ArticleCard";
import SearchBar from "@/components/ui/SearchBar";
import { fallbackArticles, fallbackCategories } from "@/lib/fallback-content";
import { getLiveFallbackHomeData } from "@/lib/live-fallback-content";

interface Props {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}

const PER_PAGE = 12;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (await searchParams)?.q;
  return { title: q ? `Search: "${q}"` : "Search Articles" };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params?.q?.trim() || "";
  const page = parseInt(params?.page || "1");
  const category = params?.category || "";
  const skip = (page - 1) * PER_PAGE;

  const where: any = { status: "PUBLISHED" };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) where.category = { slug: category };

  let articles: any[] = [];
  let total = 0;
  let categories: any[] = [];
  const live = await getLiveFallbackHomeData().catch(() => null);
  const livePool = live?.latestByCategory || [];

  if (live?.categories.length) {
    categories = live.categories;
    articles = q
      ? livePool.filter((item) => {
          const haystack = `${item.title} ${item.excerpt || ""} ${item.content || ""} ${item.category.name}`.toLowerCase();
          return haystack.includes(q.toLowerCase()) && (!category || item.category.slug === category);
        })
      : [];
    total = articles.length;
  }

  if (!categories.length) try {
    [articles, total, categories] = await Promise.all([
      q ? prisma.article.findMany({
        where, skip, take: PER_PAGE,
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      }) : [],
      q ? prisma.article.count({ where }) : Promise.resolve(0),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    if (!categories.length || (q && !articles.length)) {
      categories = live?.categories.length ? live.categories : fallbackCategories;
      const pool = live?.latestByCategory.length ? live.latestByCategory : fallbackArticles;
      articles = q
        ? pool.filter((item) => {
            const haystack = `${item.title} ${item.excerpt || ""} ${item.category.name}`.toLowerCase();
            return haystack.includes(q.toLowerCase()) && (!category || item.category.slug === category);
          })
        : [];
      total = articles.length;
    }
  } catch (error) {
    console.error("Search data unavailable, rendering fallback search:", error);
    const normalized = q.toLowerCase();
    const live = await getLiveFallbackHomeData().catch(() => null);
    categories = live?.categories.length ? live.categories : fallbackCategories;
    const pool = live?.latestByCategory.length ? live.latestByCategory : fallbackArticles;
    articles = q
      ? pool.filter((item) => {
          const haystack = `${item.title} ${item.excerpt || ""} ${item.category.name}`.toLowerCase();
          return haystack.includes(normalized) && (!category || item.category.slug === category);
        })
      : [];
    total = articles.length;
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center" style={{ fontFamily: "Georgia, serif" }}>
            Search The Kenya Brief
          </h1>
          <SearchBar initialQuery={q} />
        </div>

        {q && (
          <p className="text-sm text-gray-600 font-sans mb-6">
            {total > 0 ? (
              <>Found <strong>{total}</strong> result{total !== 1 ? "s" : ""} for "<strong>{q}</strong>"</>
            ) : (
              <>No results found for "<strong>{q}</strong>"</>
            )}
          </p>
        )}

        {articles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article as any} />
            ))}
          </div>
        )}

        {!q && (
          <div className="text-center py-8 text-gray-500 font-sans">
            <p className="text-lg mb-4">Start typing to search thousands of articles</p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <a key={cat.id} href={`/category/${cat.slug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white font-sans"
                  style={{ backgroundColor: cat.color || "#C8102E" }}>
                  {cat.icon} {cat.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
