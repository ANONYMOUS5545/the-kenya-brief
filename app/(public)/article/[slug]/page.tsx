export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ArticleCard from "@/components/article/ArticleCard";
import CommentSection from "@/components/article/CommentSection";
import ShareButtons from "@/components/article/ShareButtons";
import VocalizeButton from "@/components/article/VocalizeButton";
import { fallbackArticles } from "@/lib/fallback-content";
import type { ArticleWithRelations } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Calendar, Tag, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PUBLIC_NEWS_AUTHOR_NAME } from "@/lib/news-automation";
import { getSiteUrl } from "@/lib/site-url";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
    });
    return article || fallbackArticles.find((item) => item.slug === slug) || null;
  } catch (error) {
    console.error("Article data unavailable, rendering fallback article:", error);
    return fallbackArticles.find((item) => item.slug === slug) || null;
  }
}

async function getRelated(categoryId: string, currentId: string) {
  try {
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED", categoryId, id: { not: currentId } },
      orderBy: { publishedAt: "desc" },
      take: 4,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
    });
    if (articles.length) return articles;
  } catch (error) {
    console.error("Related article data unavailable, rendering fallback related stories:", error);
  }

  const current = fallbackArticles.find((item) => item.id === currentId);
  return fallbackArticles
    .filter((item) => item.id !== currentId && (!current || item.category.slug === current.category.slug))
    .slice(0, 4);
}

function getPlainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt || "",
    openGraph: {
      title: article.title,
      description: article.excerpt || "",
      images: article.featuredImage ? [{ url: article.featuredImage }] : [],
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      authors: [PUBLIC_NEWS_AUTHOR_NAME],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const related = await getRelated(article.categoryId, article.id);
  const catColor = article.category?.color || "#C8102E";
  const appUrl = getSiteUrl();
  const articleUrl = `${appUrl}/article/${article.slug}`;
  const vocalizeText = [article.title, article.excerpt, getPlainText(article.content)]
    .filter(Boolean)
    .join(". ");

  // Increment view (fire and forget)
  prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex items-center gap-2 text-xs text-gray-500 font-sans">
              <Link href="/" className="hover:text-red-700">Home</Link>
              <ChevronRight size={12} />
              <Link href={`/category/${article.category.slug}`} className="hover:text-red-700">{article.category.name}</Link>
              <ChevronRight size={12} />
              <span className="text-gray-400 line-clamp-1">{article.title}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Article Content */}
            <div className="lg:col-span-3">
              <article className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Category & Badges */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Link href={`/category/${article.category.slug}`}>
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full text-white font-sans" style={{ backgroundColor: catColor }}>
                        {article.category.name}
                      </span>
                    </Link>
                    {article.isBreaking && (
                      <span className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded-full font-sans animate-pulse">BREAKING</span>
                    )}
                    {article.isTrending && (
                      <span className="px-3 py-1 text-xs font-bold bg-orange-500 text-white rounded-full font-sans">TRENDING</span>
                    )}
                  </div>

                  {/* Headline */}
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4" style={{ fontFamily: "Georgia, serif" }}>
                    {article.title}
                  </h1>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-lg text-gray-600 font-sans leading-relaxed border-l-4 pl-4 mb-4" style={{ borderColor: catColor }}>
                      {article.excerpt}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-700 font-bold text-xs">{PUBLIC_NEWS_AUTHOR_NAME[0]}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{PUBLIC_NEWS_AUTHOR_NAME}</span>
                        <span className="text-xs text-gray-400 block">Staff Reporter</span>
                      </div>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {formatDate(article.publishedAt || article.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {article.readTime || 3} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={13} /> {article.viewCount.toLocaleString()} views
                    </span>
                  </div>

                  {/* Share */}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <ShareButtons title={article.title} url={articleUrl} />
                    <VocalizeButton text={vocalizeText} />
                  </div>
                </div>

                {/* Featured Image */}
                {article.featuredImage && (
                  <div className="relative aspect-video bg-gray-100">
                    <Image
                      src={article.featuredImage}
                      alt={article.featuredImageAlt || article.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}

                {/* Article Body */}
                <div className="px-6 py-6">
                  {article.videoUrl && (
                    <div className="mb-6 rounded-xl overflow-hidden aspect-video bg-black">
                      <iframe
                        src={article.videoUrl}
                        title={article.title}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  )}

                  <div
                    className="article-body text-gray-800 text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag size={14} className="text-gray-400" />
                        {article.tags.map(({ tag }) => (
                          <Link
                            key={tag.id}
                            href={`/tag/${tag.slug}`}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 rounded-full font-sans transition-colors"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Author Bio */}
                  <div className="mt-8 p-5 bg-gray-50 rounded-xl flex gap-4">
                    <div className="w-14 h-14 bg-red-700 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xl font-bold">{PUBLIC_NEWS_AUTHOR_NAME[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 font-sans">{PUBLIC_NEWS_AUTHOR_NAME}</p>
                      <p className="text-xs text-red-700 font-sans mb-1">Staff Reporter, The Kenya Brief</p>
                      <p className="text-sm text-gray-600 font-sans">
                        Kenya Brief reports and organizes the latest developments across Kenya and the broader East Africa region.
                      </p>
                    </div>
                  </div>

                  {/* Share Bottom */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3 font-sans">Share this story:</p>
                    <ShareButtons title={article.title} url={articleUrl} />
                  </div>
                </div>
              </article>

              {/* Comments */}
              <div className="mt-8">
                <CommentSection articleId={article.id} />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 sticky top-20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-red-700 pb-2" style={{ fontFamily: "Georgia, serif" }}>
                  Related Stories
                </h3>
                <div className="flex flex-col gap-4">
                  {related.length > 0 ? (
                    related.map((a) => (
                      <ArticleCard key={a.id} article={a as ArticleWithRelations} variant="compact" />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 font-sans">No related articles yet.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
