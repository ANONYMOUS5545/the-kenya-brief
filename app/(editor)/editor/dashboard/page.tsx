export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Eye, CheckCircle, Clock, PlusCircle, AlertCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-800",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  DRAFT: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-800",
  APPROVED: "bg-blue-100 text-blue-800",
};

export default async function EditorDashboard() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isSenior = user?.role === "SENIOR_EDITOR";

  const [myArticles, pendingCount, publishedCount, totalViews] = await Promise.all([
    prisma.article.findMany({
      where: isSenior ? {} : { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.article.count({
      where: {
        ...(isSenior ? {} : { authorId: user.id }),
        status: "PENDING_REVIEW",
      },
    }),
    prisma.article.count({
      where: {
        ...(isSenior ? {} : { authorId: user.id }),
        status: "PUBLISHED",
      },
    }),
    prisma.article.aggregate({
      where: isSenior ? { status: "PUBLISHED" } : { authorId: user.id, status: "PUBLISHED" },
      _sum: { viewCount: true },
    }),
  ]);

  const rejectedArticles = myArticles.filter((a) => a.status === "REJECTED");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-500 font-sans text-sm mt-1">
          {isSenior ? "Senior Editor — you can approve and publish articles." : "Junior Editor — submit articles for review."}
        </p>
      </div>

      {/* Alerts */}
      {rejectedArticles.length > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-800 font-sans">
            <strong>{rejectedArticles.length} article{rejectedArticles.length !== 1 ? "s" : ""}</strong> have been rejected. Check editor feedback.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: isSenior ? "All Articles" : "My Articles", value: myArticles.length, icon: FileText, color: "bg-blue-500" },
          { label: "Published", value: publishedCount, icon: CheckCircle, color: "bg-green-500" },
          { label: "Pending Review", value: pendingCount, icon: Clock, color: "bg-yellow-500" },
          { label: "Total Views", value: (totalViews._sum.viewCount || 0).toLocaleString(), icon: Eye, color: "bg-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={16} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 font-sans">{value}</p>
            <p className="text-xs font-medium text-gray-600 font-sans mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link href="/editor/articles/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 font-sans">
          <PlusCircle size={16} /> Write New Article
        </Link>
        <Link href="/editor/articles"
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-sans">
          <FileText size={16} /> View All My Articles
        </Link>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 font-sans">
            {isSenior ? "All Articles" : "My Articles"}
          </h2>
          <Link href="/editor/articles" className="text-xs text-red-700 hover:underline font-sans">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Title", isSenior ? "Author" : null, "Category", "Status", "Views", "Date"].filter(Boolean).map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
                <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myArticles.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-900 truncate">{a.title}</p>
                    {a.status === "REJECTED" && a.rejectionReason && (
                      <p className="text-xs text-red-600 mt-0.5 truncate">Rejected: {a.rejectionReason}</p>
                    )}
                  </td>
                  {isSenior && <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.author.name}</td>}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ backgroundColor: (a.category as any)?.color || "#6B7280" }}>
                      {a.category?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[a.status] || "bg-gray-100"}`}>
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.viewCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{timeAgo(a.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/editor/articles/edit/${a.id}`}
                      className="text-xs text-blue-600 hover:underline font-sans">Edit</Link>
                  </td>
                </tr>
              ))}
              {myArticles.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 font-sans">No articles yet. Write your first article!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
