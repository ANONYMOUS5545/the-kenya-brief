export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Users, MessageSquare, Eye, TrendingUp, Clock, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";
import { timeAgo } from "@/lib/utils";

async function getDashboardData() {
  const [
    totalArticles, publishedArticles, pendingArticles, draftArticles,
    totalUsers, totalComments, pendingComments,
    totalViews, recentArticles, topArticles,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.article.aggregate({ _sum: { viewCount: true } }),
    prisma.article.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" }, orderBy: { viewCount: "desc" }, take: 5,
      select: { id: true, title: true, slug: true, viewCount: true, publishedAt: true },
    }),
  ]);

  return {
    stats: {
      totalArticles, publishedArticles, pendingArticles, draftArticles,
      totalUsers, totalComments, pendingComments,
      totalViews: totalViews._sum.viewCount || 0,
    },
    recentArticles, topArticles,
  };
}

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-800",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  DRAFT: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-800",
  APPROVED: "bg-blue-100 text-blue-800",
};

export default async function AdminDashboard() {
  const { stats, recentArticles, topArticles } = await getDashboardData();

  const statCards = [
    { label: "Total Articles", value: stats.totalArticles, icon: FileText, color: "bg-blue-500", sub: `${stats.publishedArticles} published` },
    { label: "Pending Review", value: stats.pendingArticles, icon: Clock, color: "bg-yellow-500", sub: "Awaiting approval", alert: stats.pendingArticles > 0 },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-purple-500", sub: "Registered accounts" },
    { label: "Total Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "bg-red-600", sub: "All time views" },
    { label: "Comments", value: stats.totalComments, icon: MessageSquare, color: "bg-green-500", sub: `${stats.pendingComments} pending` },
    { label: "Draft Articles", value: stats.draftArticles, icon: FileText, color: "bg-gray-500", sub: "Not yet submitted" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Admin Dashboard</h1>
        <p className="text-gray-500 font-sans text-sm mt-1">Welcome back. Here's what's happening at The Kenya Brief.</p>
      </div>

      {/* Alerts */}
      {stats.pendingArticles > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 font-sans">
            <strong>{stats.pendingArticles} article{stats.pendingArticles !== 1 ? "s" : ""}</strong> pending review.{" "}
            <Link href="/admin/articles?status=PENDING_REVIEW" className="underline hover:no-underline">Review now →</Link>
          </p>
        </div>
      )}
      {stats.pendingComments > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <MessageSquare size={18} className="text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800 font-sans">
            <strong>{stats.pendingComments} comment{stats.pendingComments !== 1 ? "s" : ""}</strong> awaiting moderation.{" "}
            <Link href="/admin/comments?status=PENDING" className="underline hover:no-underline">Moderate now →</Link>
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, sub, alert }) => (
          <div key={label} className={`bg-white rounded-xl p-4 shadow-sm border ${alert ? "border-yellow-300" : "border-gray-100"}`}>
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 font-sans">{value}</p>
            <p className="text-xs font-semibold text-gray-700 font-sans mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 font-sans mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 font-sans">Recent Articles</h2>
            <Link href="/admin/articles" className="text-xs text-red-700 hover:underline font-sans">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentArticles.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 font-sans truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 font-sans">{a.author.name}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-sans"
                      style={{ fontSize: "10px", backgroundColor: ((a.category as any)?.color || "#6B7280") + "20", color: (a.category as any)?.color || "#6B7280" }}>
                      {(a.category as any)?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-sans ${statusColors[a.status] || "bg-gray-100"}`}>
                    {a.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-400 font-sans">{timeAgo(a.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Articles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 font-sans flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" /> Top Articles
            </h2>
            <Link href="/admin/analytics" className="text-xs text-red-700 hover:underline font-sans">Analytics</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topArticles.map((a, i) => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-200 font-sans w-8 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link href={`/article/${a.slug}`} target="_blank"
                    className="text-sm font-medium text-gray-900 hover:text-red-700 font-sans truncate block">
                    {a.title}
                  </Link>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">{timeAgo(a.publishedAt || new Date())}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-gray-700 shrink-0 font-sans">
                  <Eye size={13} className="text-gray-400" /> {(a.viewCount || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 font-sans mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/admin/articles/new", label: "New Article", color: "bg-red-700 text-white hover:bg-red-800" },
            { href: "/admin/users", label: "Manage Users", color: "bg-purple-600 text-white hover:bg-purple-700" },
            { href: "/admin/articles?status=PENDING_REVIEW", label: "Review Pending", color: "bg-yellow-500 text-white hover:bg-yellow-600" },
            { href: "/admin/comments?status=PENDING", label: "Moderate Comments", color: "bg-blue-600 text-white hover:bg-blue-700" },
            { href: "/admin/categories", label: "Categories", color: "bg-green-600 text-white hover:bg-green-700" },
            { href: "/admin/analytics", label: "View Analytics", color: "bg-gray-700 text-white hover:bg-gray-800" },
            { href: "/admin/news-automation", label: "News Automation", color: "bg-red-700 text-white hover:bg-red-800" },
          ].map(({ href, label, color }) => (
            <Link key={href} href={href}
              className={`px-4 py-2 rounded-lg text-sm font-semibold font-sans transition-colors ${color}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
