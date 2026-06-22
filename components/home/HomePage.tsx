import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArticleCard from "@/components/article/ArticleCard";
import BreakingNewsCarousel from "@/components/article/BreakingNewsCarousel";
import NewsletterForm from "@/components/ui/NewsletterForm";
import NewsRefreshOnOpen from "@/components/news/NewsRefreshOnOpen";
import { getFallbackHomeData } from "@/lib/fallback-content";
import { getLiveFallbackHomeData } from "@/lib/live-fallback-content";
import Link from "next/link";
import { TrendingUp, ChevronRight } from "lucide-react";

async function queryHomeData() {
  const [featured, trending, breaking, latestByCategory, categories] = await Promise.all([
      prisma.article.findMany({
        where: { status: "PUBLISHED", isFeatured: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED", isTrending: true },
        orderBy: { viewCount: "desc" },
        take: 6,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED", isBreaking: true },
        orderBy: { publishedAt: "desc" },
        take: 6,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 12,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } },
      }),
    ]);

  return { featured, trending, breaking, latestByCategory, categories };
}

async function getHomeData() {
  try {
    const liveData = await getLiveFallbackHomeData().catch(() => null);
    if (liveData?.latestByCategory.length) return liveData;

    const data = await queryHomeData();

    if (!data.latestByCategory.length || !data.categories.length) {
      return await getLiveFallbackHomeData().catch(() => getFallbackHomeData());
    }

    return data;
  } catch (error) {
    console.error("Homepage data unavailable, rendering fallback content:", error);
    return await getLiveFallbackHomeData().catch(() => getFallbackHomeData());
  }
}

export default async function HomePage() {
  const { featured, trending, breaking, latestByCategory, categories } = await getHomeData();

  const [heroArticle, ...otherFeatured] = featured.length ? featured : latestByCategory.slice(0, 5);
  const secondaryFeatured = otherFeatured.slice(0, 2);
  const mainArticles = latestByCategory.slice(0, 8);
  const sidebarArticles = latestByCategory.slice(8, 12);

  return (
    <div className="min-h-screen bg-gray-50">
      <NewsRefreshOnOpen />
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            {heroArticle ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Hero */}
                <div className="lg:col-span-2">
                  <ArticleCard article={heroArticle as any} variant="large" priority />
                </div>
                {/* Secondary Features */}
                <div className="flex flex-col gap-4">
                  {secondaryFeatured.map((article, i) => (
                    <ArticleCard key={article.id} article={article as any} variant="featured" priority={i === 0} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500 font-sans">
                <p className="text-2xl mb-2">📰</p>
                <p>No articles published yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* Category Quick Nav */}
        <section className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
              <Link href="/" className="shrink-0 px-4 py-1.5 bg-red-700 text-white text-xs font-bold rounded-full font-sans uppercase tracking-wide">
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="shrink-0 px-4 py-1.5 text-xs font-bold rounded-full font-sans uppercase tracking-wide text-gray-600 hover:text-white transition-colors border border-gray-200 hover:bg-[var(--cat-color)] hover:border-[var(--cat-color)]"
                  style={{ ["--cat-color" as any]: cat.color || "#C8102E" }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Breaking News Carousel */}
        {breaking.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <BreakingNewsCarousel
              slides={breaking.map((article) => ({
                id: article.id,
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                category: article.category
                  ? {
                      name: article.category.name,
                      color: article.category.color || "#C8102E",
                    }
                  : undefined,
              }))}
              autoPlayInterval={5000}
            />
          </section>
        )}

        {/* Main Content + Sidebar */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Latest News */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-red-700 pl-3" style={{ fontFamily: "Georgia, serif" }}>
                  Latest News
                </h2>
                <Link href="/search" className="text-sm text-red-700 hover:text-red-800 font-sans font-medium flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                {mainArticles.map((article, i) => (
                  <ArticleCard key={article.id} article={article as any} variant="default" priority={i < 3} />
                ))}
              </div>

              {/* Trending Section */}
              {trending.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-orange-500 pl-3" style={{ fontFamily: "Georgia, serif" }}>
                      <span className="flex items-center gap-2"><TrendingUp size={22} className="text-orange-500" /> Trending Now</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {trending.slice(0, 6).map((article) => (
                      <ArticleCard key={article.id} article={article as any} variant="default" />
                    ))}
                  </div>
                </>
              )}

              {/* Category Sections */}
              {["politics", "sports", "business", "entertainment"].map((catSlug) => {
                const catArticles = latestByCategory.filter(a => a.category?.slug === catSlug);
                const category = categories.find(c => c.slug === catSlug);
                if (!catArticles.length || !category) return null;
                return (
                  <div key={catSlug} className="mt-10">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-2xl font-bold text-gray-900 border-l-4 pl-3" style={{ fontFamily: "Georgia, serif", borderColor: category.color || "#C8102E" }}>
                        {category.name}
                      </h2>
                      <Link href={`/category/${catSlug}`} className="text-sm font-sans font-medium flex items-center gap-1" style={{ color: category.color || "#C8102E" }}>
                        More {category.name} <ChevronRight size={14} />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {catArticles.slice(0, 2).map((article) => (
                        <ArticleCard key={article.id} article={article as any} variant="featured" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Most Read */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-red-700 pb-2" style={{ fontFamily: "Georgia, serif" }}>
                  Most Read
                </h3>
                <div className="flex flex-col gap-4">
                  {(trending.length ? trending : latestByCategory).slice(0, 5).map((article, i) => (
                    <div key={article.id} className="flex gap-3 group">
                      <span className="text-3xl font-bold text-gray-200 font-sans leading-none w-8 shrink-0 pt-0.5">
                        {i + 1}
                      </span>
                      <ArticleCard article={article as any} variant="compact" showMeta={false} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-red-700 pb-2" style={{ fontFamily: "Georgia, serif" }}>
                  Browse Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-full font-sans border-2 text-white"
                      style={{ backgroundColor: cat.color || "#C8102E", borderColor: cat.color || "#C8102E" }}
                    >
                      {cat.icon} {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Articles in Sidebar */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-red-700 pb-2" style={{ fontFamily: "Georgia, serif" }}>
                  More Stories
                </h3>
                <div className="flex flex-col gap-4">
                  {sidebarArticles.map((article) => (
                    <ArticleCard key={article.id} article={article as any} variant="compact" />
                  ))}
                </div>
              </div>

              {/* Newsletter Mini */}
              <div className="bg-red-700 rounded-xl p-5 text-white">
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Georgia, serif" }}>Daily Briefing</h3>
                <p className="text-red-100 text-sm font-sans mb-4">Get top Kenya stories delivered each morning.</p>
                <NewsletterForm variant="sidebar" />
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
