import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TrendingUp, Eye, FileText, Users, MessageSquare, BarChart3 } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  const [
    totalViews, topArticles, categoryStats, publishedByMonth, userGrowth,
    recentActivity,
  ] = await Promise.all([
    prisma.article.aggregate({ _sum: { viewCount: true }, where: { status: "PUBLISHED" } }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" }, orderBy: { viewCount: "desc" }, take: 10,
      include: { category: { select: { name: true, color: true } } },
    }),
    prisma.category.findMany({
      include: {
        _count: { select: { articles: { where: { status: "PUBLISHED" } } } },
        articles: { where: { status: "PUBLISHED" }, select: { viewCount: true } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.article.groupBy({
      by: ["publishedAt"],
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      _count: true,
    }),
    prisma.user.groupBy({
      by: ["createdAt"],
      _count: true,
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" }, take: 20,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const totalViewCount = totalViews._sum.viewCount || 0;
  const categoryData = categoryStats.map((cat) => ({
    ...cat,
    totalViews: cat.articles.reduce((sum: number, a: any) => sum + (a.viewCount || 0), 0),
    articleCount: cat._count.articles,
  })).sort((a, b) => b.totalViews - a.totalViews);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Analytics</h1>
        <p className="text-gray-500 font-sans text-sm mt-1">Platform performance and engagement metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Views", value: totalViewCount.toLocaleString(), icon: Eye, color: "bg-red-600", desc: "All published articles" },
          { label: "Published", value: topArticles.length, icon: FileText, color: "bg-blue-600", desc: "Top 10 shown" },
          { label: "Avg. Views/Article", value: topArticles.length ? Math.round(totalViewCount / Math.max(topArticles.length, 1)).toLocaleString() : "0", icon: BarChart3, color: "bg-green-600", desc: "Per published article" },
          { label: "Most Viewed", value: topArticles[0]?.viewCount.toLocaleString() || "0", icon: TrendingUp, color: "bg-orange-500", desc: topArticles[0]?.title?.substring(0, 20) + "..." || "N/A" },
        ].map(({ label, value, icon: Icon, color, desc }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 font-sans">{value}</p>
            <p className="text-xs font-semibold text-gray-700 font-sans mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 font-sans mt-0.5 truncate">{desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Top Articles */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 font-sans flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" /> Top Performing Articles
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {topArticles.map((a, i) => {
              const pct = totalViewCount > 0 ? (a.viewCount / totalViewCount) * 100 : 0;
              return (
                <div key={a.id} className="px-5 py-3">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-bold text-gray-200 font-sans w-6 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <Link href={`/article/${a.slug}`} target="_blank"
                        className="text-sm font-medium text-gray-900 hover:text-red-700 font-sans truncate block">
                        {a.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium" style={{ color: (a.category as any)?.color || "#6B7280" }}>
                          {(a.category as any)?.name}
                        </span>
                        <span className="text-xs text-gray-400 font-sans flex items-center gap-1">
                          <Eye size={11} /> {a.viewCount.toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-9">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 font-sans flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-500" /> Category Performance
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {categoryData.map((cat) => {
              const maxViews = Math.max(...categoryData.map((c) => c.totalViews), 1);
              const pct = (cat.totalViews / maxViews) * 100;
              return (
                <div key={cat.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 font-sans flex items-center gap-1">
                      {cat.icon} {cat.name}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-sans">
                      <span>{cat.articleCount} articles</span>
                      <span className="flex items-center gap-1"><Eye size={11} /> {cat.totalViews.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, pct)}%`, backgroundColor: cat.color || "#C8102E" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 font-sans">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentActivity.map((log) => (
            <div key={log.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-sans">{log.details || log.action}</p>
                <p className="text-xs text-gray-400 font-sans">{log.user?.name || "System"}</p>
              </div>
              <span className="text-xs text-gray-400 font-sans shrink-0">{timeAgo(log.createdAt)}</span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 font-sans text-sm">No activity logged yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
