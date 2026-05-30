import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import AdminArticleActions from "@/components/admin/AdminArticleActions";

interface Props {
  searchParams: { status?: string; page?: string; search?: string };
}

const PER_PAGE = 15;

const statusLabels: Record<string, { label: string; color: string }> = {
  ALL: { label: "All", color: "bg-gray-100 text-gray-700" },
  PUBLISHED: { label: "Published", color: "bg-green-100 text-green-800" },
  PENDING_REVIEW: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-800" },
};

export default async function AdminArticlesPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status || "ALL";
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const skip = (page - 1) * PER_PAGE;

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where, skip, take: PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const counts = await Promise.all(
    Object.keys(statusLabels).map(async (s) => ({
      status: s,
      count: await prisma.article.count({ where: s === "ALL" ? {} : { status: s as any } }),
    }))
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Articles</h1>
          <p className="text-gray-500 font-sans text-sm mt-1">{total} total articles</p>
        </div>
        <Link href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 transition-colors font-sans">
          <Plus size={16} /> New Article
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
        {counts.map(({ status: s, count }) => (
          <Link key={s} href={`/admin/articles?status=${s}`}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors ${
              status === s ? "bg-red-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {statusLabels[s].label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${status === s ? "bg-red-600" : "bg-gray-200"}`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-4">
        <input type="hidden" name="status" value={status} />
        <input type="text" name="search" defaultValue={search} placeholder="Search articles..."
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500" />
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Title", "Author", "Category", "Status", "Views", "Created", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-900 truncate">{article.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {article.isFeatured && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Featured</span>}
                      {article.isBreaking && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Breaking</span>}
                      {article.isTrending && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Trending</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{article.author.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: (article.category as any)?.color || "#6B7280" }}>
                      {article.category?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusLabels[article.status]?.color || "bg-gray-100"}`}>
                      {article.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    <span className="flex items-center gap-1"><Eye size={13} className="text-gray-400" />{article.viewCount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">{timeAgo(article.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <AdminArticleActions article={{ id: article.id, slug: article.slug, status: article.status }} />
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    <p>No articles found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-sans">Showing {skip + 1}–{Math.min(skip + PER_PAGE, total)} of {total}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/articles?status=${status}&page=${page - 1}`}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-sans hover:bg-gray-50">← Prev</Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/articles?status=${status}&page=${page + 1}`}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-sans hover:bg-gray-50">Next →</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
