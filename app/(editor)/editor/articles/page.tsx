import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import AdminArticleActions from "@/components/admin/AdminArticleActions";

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-800",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  DRAFT: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-800",
};

export default async function EditorArticlesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isSenior = user?.role === "SENIOR_EDITOR";

  const articles = await prisma.article.findMany({
    where: isSenior ? {} : { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, color: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">
          {isSenior ? "All Articles" : "My Articles"}
        </h1>
        <Link href="/editor/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 font-sans">
          <Plus size={16} /> Write Article
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Title", isSenior ? "Author" : null, "Category", "Status", "Views", "Date", "Actions"].filter(Boolean).map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-900 truncate">{a.title}</p>
                    {a.rejectionReason && (
                      <p className="text-xs text-red-600 mt-0.5 truncate">↩ {a.rejectionReason}</p>
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
                  <td className="px-4 py-3 text-gray-600">{a.viewCount}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{timeAgo(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/editor/articles/edit/${a.id}`} className="text-xs text-blue-600 hover:underline font-sans">Edit</Link>
                      {isSenior && (
                        <AdminArticleActions article={{ id: a.id, slug: a.slug, status: a.status }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 font-sans">
                  No articles yet.{" "}
                  <Link href="/editor/articles/new" className="text-red-700 hover:underline">Write your first article</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
