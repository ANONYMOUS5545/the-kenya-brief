"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Edit, Trash2, CheckCircle, XCircle, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  article: { id: string; slug: string; status: string };
}

export default function AdminArticleActions({ article }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Article ${status.toLowerCase().replace("_", " ")}`);
        router.refresh();
      } else {
        toast.error(data.error || "Update failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async () => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Article deleted");
        router.refresh();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center gap-1">
      {article.status === "PUBLISHED" && (
        <Link href={`/article/${article.slug}`} target="_blank"
          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded" title="View">
          <Eye size={15} />
        </Link>
      )}
      <Link href={`/admin/articles/edit/${article.id}`}
        className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded" title="Edit">
        <Edit size={15} />
      </Link>
      <div className="relative">
        <button onClick={() => setOpen(!open)} disabled={loading}
          className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded">
          <MoreVertical size={15} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white shadow-xl border border-gray-100 rounded-lg py-1 z-50 w-44"
            onMouseLeave={() => setOpen(false)}>
            {article.status === "PENDING_REVIEW" && (
              <>
                <button onClick={() => updateStatus("PUBLISHED")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-700 hover:bg-green-50 font-sans">
                  <CheckCircle size={13} /> Approve & Publish
                </button>
                <button onClick={() => updateStatus("REJECTED")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-700 hover:bg-red-50 font-sans">
                  <XCircle size={13} /> Reject
                </button>
              </>
            )}
            {article.status !== "PUBLISHED" && article.status !== "PENDING_REVIEW" && (
              <button onClick={() => updateStatus("PUBLISHED")}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-700 hover:bg-green-50 font-sans">
                <CheckCircle size={13} /> Publish Now
              </button>
            )}
            {article.status === "PUBLISHED" && (
              <button onClick={() => updateStatus("DRAFT")}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-sans">
                <XCircle size={13} /> Unpublish
              </button>
            )}
            <hr className="my-1 border-gray-100" />
            <button onClick={deleteArticle}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-700 hover:bg-red-50 font-sans">
              <Trash2 size={13} /> Delete Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
