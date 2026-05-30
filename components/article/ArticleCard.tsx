import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, MessageCircle, Calendar } from "lucide-react";
import { timeAgo, formatDate } from "@/lib/utils";
import type { ArticleWithRelations } from "@/types";

interface ArticleCardProps {
  article: ArticleWithRelations;
  variant?: "default" | "featured" | "compact" | "horizontal" | "large";
  showExcerpt?: boolean;
  showMeta?: boolean;
  priority?: boolean;
}

export default function ArticleCard({
  article,
  variant = "default",
  showExcerpt = true,
  showMeta = true,
  priority = false,
}: ArticleCardProps) {
  const categoryColor = article.category?.color || "#C8102E";

  if (variant === "compact") {
    return (
      <Link href={`/article/${article.slug}`} className="flex gap-3 group">
        {article.featuredImage && (
          <div className="relative w-20 h-16 shrink-0 rounded overflow-hidden bg-gray-100">
            <Image src={article.featuredImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold font-sans uppercase tracking-wide" style={{ color: categoryColor }}>
            {article.category?.name}
          </span>
          <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug mt-0.5">
            {article.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1 font-sans">{timeAgo(article.publishedAt || article.createdAt)}</p>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="flex gap-4 group">
        {article.featuredImage && (
          <Link href={`/article/${article.slug}`} className="relative w-36 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <Image src={article.featuredImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" priority={priority} />
            {article.isBreaking && (
              <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-sans font-bold">LIVE</span>
            )}
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/category/${article.category?.slug}`}>
              <span className="text-xs font-bold uppercase tracking-wide font-sans" style={{ color: categoryColor }}>
                {article.category?.name}
              </span>
            </Link>
          </div>
          <Link href={`/article/${article.slug}`}>
            <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 text-sm leading-snug">
              {article.title}
            </h3>
          </Link>
          {showExcerpt && article.excerpt && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2 font-sans leading-relaxed">{article.excerpt}</p>
          )}
          {showMeta && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-sans">
              <span>{article.author?.name}</span>
              <span>•</span>
              <span>{timeAgo(article.publishedAt || article.createdAt)}</span>
              {article.readTime && <span>• {article.readTime} min read</span>}
            </div>
          )}
        </div>
      </article>
    );
  }

  if (variant === "large") {
    return (
      <article className="group">
        <Link href={`/article/${article.slug}`} className="block relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 mb-4">
          {article.featuredImage ? (
            <Image src={article.featuredImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" priority={priority} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-4xl">📰</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-bold text-white rounded font-sans" style={{ backgroundColor: categoryColor }}>
                {article.category?.name}
              </span>
              {article.isBreaking && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded font-sans">BREAKING</span>
              )}
            </div>
            <h2 className="text-white text-xl font-bold leading-tight line-clamp-2">
              {article.title}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-gray-300 text-xs font-sans">
              <span>{article.author?.name}</span>
              <span>•</span>
              <span>{timeAgo(article.publishedAt || article.createdAt)}</span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className="group">
        <Link href={`/article/${article.slug}`} className="block relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
          {article.featuredImage ? (
            <Image src={article.featuredImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" priority={priority} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center">
              <span className="text-5xl opacity-50">📰</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {article.isBreaking && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded font-sans font-bold animate-pulse">
              BREAKING NEWS
            </span>
          )}
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/category/${article.category?.slug}`}>
              <span className="text-xs font-bold uppercase tracking-wide font-sans" style={{ color: categoryColor }}>
                {article.category?.name}
              </span>
            </Link>
          </div>
          <Link href={`/article/${article.slug}`}>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-red-700 transition-colors leading-snug line-clamp-3">
              {article.title}
            </h2>
          </Link>
          {showExcerpt && article.excerpt && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2 font-sans leading-relaxed">{article.excerpt}</p>
          )}
          {showMeta && (
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 font-sans">
              <span className="font-medium text-gray-700">{article.author?.name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={11} /> {timeAgo(article.publishedAt || article.createdAt)}
              </span>
              {article.viewCount > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> {article.viewCount.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }

  // Default card
  return (
    <article className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
      <Link href={`/article/${article.slug}`} className="block relative aspect-[16/9] overflow-hidden bg-gray-100">
        {article.featuredImage ? (
          <Image src={article.featuredImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" priority={priority} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-3xl opacity-40">📰</span>
          </div>
        )}
        {article.isBreaking && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-sans font-bold">BREAKING</span>
        )}
        {article.isTrending && !article.isBreaking && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded font-sans font-bold">TRENDING</span>
        )}
      </Link>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/category/${article.category?.slug}`}>
            <span className="text-xs font-bold uppercase tracking-wide font-sans" style={{ color: categoryColor }}>
              {article.category?.name}
            </span>
          </Link>
        </div>
        <Link href={`/article/${article.slug}`}>
          <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>
        </Link>
        {showExcerpt && article.excerpt && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2 font-sans leading-relaxed">{article.excerpt}</p>
        )}
        {showMeta && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
              <span className="font-medium text-gray-700">{article.author?.name}</span>
              <span>•</span>
              <span>{timeAgo(article.publishedAt || article.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-sans">
              {article.readTime && (
                <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}m</span>
              )}
              {(article._count?.comments || 0) > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} /> {article._count?.comments}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
