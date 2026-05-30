import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArticleCard from "@/components/article/ArticleCard";
import Link from "next/link";
import { Tag } from "lucide-react";

interface Props {
  params: { slug: string };
  searchParams: { page?: string };
}

const PER_PAGE = 12;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) return { title: "Tag Not Found" };
  return { title: `#${tag.name} – The Kenya Brief`, description: `All articles tagged with ${tag.name}` };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = parseInt((await searchParams)?.page || "1");

  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) notFound();

  const skip = (page - 1) * PER_PAGE;
  const where = { tags: { some: { tag: { slug } } }, status: "PUBLISHED" as const };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where, skip, take: PER_PAGE,
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="bg-gray-900 text-white py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-1">
              <Tag size={24} className="text-red-400" />
              <h1 className="text-3xl font-bold" style={{ fontFamily: "Georgia, serif" }}>#{tag.name}</h1>
            </div>
            <p className="text-gray-400 font-sans">{total} article{total !== 1 ? "s" : ""} tagged with #{tag.name}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {articles.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-sans">
              <p>No articles with this tag yet.</p>
              <Link href="/" className="mt-4 inline-block text-red-700 hover:underline">Back to Home</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
                {articles.map((a, i) => (
                  <ArticleCard key={a.id} article={a as any} priority={i < 4} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  {page > 1 && (
                    <Link href={`/tag/${slug}?page=${page - 1}`} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-sans hover:bg-gray-50">← Prev</Link>
                  )}
                  {page < totalPages && (
                    <Link href={`/tag/${slug}?page=${page + 1}`} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-sans hover:bg-gray-50">Next →</Link>
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
