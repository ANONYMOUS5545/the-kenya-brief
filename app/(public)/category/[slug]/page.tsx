import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArticleCard from "@/components/article/ArticleCard";
import Link from "next/link";

interface Props {
  params: { slug: string };
  searchParams: { page?: string };
}

const PER_PAGE = 12;

async function getCategory(slug: string) {
  return prisma.category.findUnique({ where: { slug, isActive: true } });
}

async function getCategoryArticles(categoryId: string, page: number) {
  const skip = (page - 1) * PER_PAGE;
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", categoryId },
      orderBy: { publishedAt: "desc" },
      skip,
      take: PER_PAGE,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.article.count({ where: { status: "PUBLISHED", categoryId } }),
  ]);
  return { articles, total, totalPages: Math.ceil(total / PER_PAGE) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: "Category Not Found" };
  return {
    title: `${cat.name} – The Kenya Brief`,
    description: cat.description || `Latest ${cat.name} news from The Kenya Brief`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = parseInt((await searchParams)?.page || "1");
  const category = await getCategory(slug);
  if (!category) notFound();
  const { articles, total, totalPages } = await getCategoryArticles(category.id, page);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {/* Hero */}
        <div className="text-white py-12" style={{ backgroundColor: category.color || "#C8102E" }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{category.icon}</span>
              <h1 className="text-4xl font-bold" style={{ fontFamily: "Georgia, serif" }}>{category.name}</h1>
            </div>
            <p className="text-white/80 font-sans">
              {category.description || `The latest ${category.name.toLowerCase()} stories from across Kenya`}
            </p>
            <p className="text-white/60 font-sans text-sm mt-1">{total} articles</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {articles.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-sans">
              <p className="text-2xl mb-2">📰</p>
              <p>No articles in this category yet.</p>
              <Link href="/" className="mt-4 inline-block text-red-700 hover:underline">Back to Home</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
                {articles.map((article, i) => (
                  <ArticleCard key={article.id} article={article as any} variant="default" priority={i < 4} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  {page > 1 && (
                    <Link href={`/category/${slug}?page=${page - 1}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-sans hover:bg-gray-50">
                      ← Previous
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                    Math.max(0, page - 3), Math.min(totalPages, page + 2)
                  ).map((p) => (
                    <Link
                      key={p}
                      href={`/category/${slug}?page=${p}`}
                      className={`px-4 py-2 rounded-lg text-sm font-sans ${p === page ? "text-white" : "border border-gray-300 hover:bg-gray-50"}`}
                      style={p === page ? { backgroundColor: category.color || "#C8102E" } : undefined}
                    >
                      {p}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link href={`/category/${slug}?page=${page + 1}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-sans hover:bg-gray-50">
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
