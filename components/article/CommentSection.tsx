"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, ThumbsUp, Flag } from "lucide-react";
import toast from "react-hot-toast";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  guestName?: string;
  user?: { id: string; name: string; image?: string };
  replies?: Comment[];
}

export default function CommentSection({ articleId }: { articleId: string }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEnteredView) return;

    fetch(`/api/comments?articleId=${articleId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setComments(d.data); })
      .finally(() => setLoading(false));
  }, [articleId, hasEnteredView]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId, content, parentId: parentId || null,
          guestName: session ? undefined : guestName,
          guestEmail: session ? undefined : guestEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Comment submitted!");
        setContent("");
        setGuestName("");
        setGuestEmail("");
        setReplyTo(null);
      } else {
        toast.error(data.error || "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const authorName = (c: Comment) => c.user?.name || c.guestName || "Anonymous";
  const authorInitial = (c: Comment) => authorName(c)[0]?.toUpperCase();

  return (
    <div ref={sectionRef} className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "Georgia, serif" }}>
          <MessageCircle size={20} className="text-red-700" />
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 font-sans">Join the conversation</h4>
        <form onSubmit={(e) => handleSubmit(e)}>
          {!session && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Your name *"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500"
              />
              <input
                type="email"
                placeholder="Email (not published) *"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500"
              />
            </div>
          )}
          <div className="flex gap-3">
            {session && (
              <div className="w-9 h-9 bg-red-700 rounded-full flex items-center justify-center shrink-0 mt-1">
                <span className="text-white text-sm font-bold">{user?.name?.[0]}</span>
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={session ? `Comment as ${user?.name}...` : "Share your thoughts..."}
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 font-sans">Comments are reviewed before publishing.</p>
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed font-sans transition-colors"
                >
                  <Send size={13} /> {submitting ? "Submitting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="px-6 py-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-12 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-sans text-sm">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-gray-600 text-sm font-bold">{authorInitial(comment)}</span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-900 font-sans">{authorName(comment)}</span>
                      <span className="text-xs text-gray-400 font-sans">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-sans">{comment.content}</p>
                  </div>
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="text-xs text-gray-500 hover:text-red-700 mt-1 ml-2 font-sans"
                  >
                    Reply
                  </button>

                  {/* Reply form */}
                  {replyTo === comment.id && (
                    <form className="mt-2 flex gap-2" onSubmit={(e) => handleSubmit(e, comment.id)}>
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-sans focus:outline-none focus:border-red-500"
                      />
                      <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 font-sans">
                        Reply
                      </button>
                    </form>
                  )}

                  {/* Replies */}
                  {comment.replies?.map((reply) => (
                    <div key={reply.id} className="flex gap-2 mt-3 ml-4">
                      <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-gray-600 text-xs font-bold">{authorInitial(reply)}</span>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-gray-900 font-sans">{authorName(reply)}</span>
                          <span className="text-xs text-gray-400 font-sans">{timeAgo(reply.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-700 font-sans">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
