"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminNewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "JUNIOR_EDITOR", bio: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User created successfully");
        router.push("/admin/users");
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Add New User</h1>
          <p className="text-gray-500 font-sans text-sm">Create an editor or admin account</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Full Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Email Address *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Role *</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 bg-white">
              <option value="READER">Reader</option>
              <option value="JUNIOR_EDITOR">Junior Editor</option>
              <option value="SENIOR_EDITOR">Senior Editor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <p className="text-xs text-gray-500 font-sans mt-1">
              {form.role === "JUNIOR_EDITOR" && "Can draft articles and submit for review. Cannot publish directly."}
              {form.role === "SENIOR_EDITOR" && "Can draft, edit, approve, and publish articles."}
              {form.role === "ADMIN" && "Full platform access including user management and settings."}
              {form.role === "READER" && "Can read articles and post comments."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Password *</label>
            <div className="relative">
              <input type="password" name="password" value={form.password}
                onChange={handleChange} required minLength={8} placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 pr-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
              placeholder="Brief bio or description of the user's role..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 disabled:opacity-60 font-sans text-sm transition-colors">
              {loading ? "Creating..." : "Create User"}
            </button>
            <Link href="/admin/users"
              className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 font-sans text-sm text-center transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
