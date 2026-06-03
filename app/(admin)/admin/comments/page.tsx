export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import AdminCommentActions from "@/components/admin/AdminCommentActions";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminCommentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status || "PENDING";

  const comments = await prisma.comment.findMany({
    where: status === "ALL" ? {} : { status: status as any },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true } },
      article: { select: { id: true, title: true, slug: true } },
    },
  });

  const counts = await Promise.all(
    ["ALL", "PENDING", "APPROVED", "REJECTED"].map(async (s) => ({
      status: s,
      count: s === "ALL" ? await prisma.comment.count() : await prisma.comment.count({ where: { status: s as any } }),
    }))
  );

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    FLAGGED: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Comment Moderation</h1>
        <p className="text-gray-500 font-sans text-sm mt-1">Review and moderate reader comments</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {counts.map(({ status: s, count }) => (
          <Link key={s} href={`/admin/comments?status=${s}`}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors ${
              status === s ? "bg-red-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {s} <span className={`px-1.5 py-0.5 rounded-full text-xs ${status === s ? "bg-red-600" : "bg-gray-200"}`}>{count}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-gray-600 text-xs font-bold">
                    {(comment.user?.name || comment.guestName || "G")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 font-sans">
                      {comment.user?.name || comment.guestName || "Guest"}
                    </span>
                    {comment.guestEmail && (
                      <span className="text-xs text-gray-400 font-sans">({comment.guestEmail})</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-sans ${statusColors[comment.status] || "bg-gray-100"}`}>
                      {comment.status}
                    </span>
                    <span className="text-xs text-gray-400 font-sans">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-sans mb-2">{comment.content}</p>
                  {comment.article && (
                    <Link href={`/article/${comment.article.slug}`} target="_blank"
                      className="text-xs text-blue-600 hover:underline font-sans">
                      On: {comment.article.title}
                    </Link>
                  )}
                </div>
                <AdminCommentActions comment={{ id: comment.id, status: comment.status }} />
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-sans">No {status.toLowerCase()} comments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
