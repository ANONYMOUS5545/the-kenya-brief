"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, Flag } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCommentActions({ comment }: { comment: { id: string; status: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`Comment ${status.toLowerCase()}`); router.refresh(); }
      else toast.error(data.error || "Update failed");
    } finally { setLoading(false); }
  };

  const deleteComment = async () => {
    if (!confirm("Delete this comment?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Comment deleted"); router.refresh(); }
      else toast.error(data.error || "Delete failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      {comment.status !== "APPROVED" && (
        <button onClick={() => updateStatus("APPROVED")} disabled={loading} title="Approve"
          className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded">
          <CheckCircle size={16} />
        </button>
      )}
      {comment.status !== "REJECTED" && (
        <button onClick={() => updateStatus("REJECTED")} disabled={loading} title="Reject"
          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded">
          <XCircle size={16} />
        </button>
      )}
      <button onClick={deleteComment} disabled={loading} title="Delete"
        className="p-1.5 text-gray-400 hover:text-red-700 transition-colors rounded">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
