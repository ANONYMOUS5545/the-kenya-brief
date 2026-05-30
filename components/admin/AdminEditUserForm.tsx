"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Save } from "lucide-react";
import toast from "react-hot-toast";

interface UserData {
  id: string; name: string; email: string; role: string;
  bio: string | null; isActive: boolean; isSuspended: boolean;
}

export default function AdminEditUserForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    bio: user.bio || "",
    isActive: user.isActive,
    isSuspended: user.isSuspended,
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { name: form.name, role: form.role, bio: form.bio, isActive: form.isActive, isSuspended: form.isSuspended };
      if (form.password) payload.password = form.password;
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { toast.success("User updated"); router.push("/admin/users"); }
      else toast.error(data.error || "Update failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Email</label>
          <input type="email" value={user.email} disabled
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-sans bg-gray-50 text-gray-500 cursor-not-allowed" />
          <p className="text-xs text-gray-400 font-sans mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Full Name *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
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
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 resize-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} name="password" value={form.password}
              onChange={handleChange} minLength={8} placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 pr-10" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-700 font-sans">Account Status</h3>
          {[
            { name: "isActive", label: "Account Active", desc: "User can log in and access the platform" },
            { name: "isSuspended", label: "Suspended", desc: "Blocks user from logging in" },
          ].map(({ name, label, desc }) => (
            <label key={name} className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700 font-sans">{label}</p>
                <p className="text-xs text-gray-400 font-sans">{desc}</p>
              </div>
              <input type="checkbox" name={name} checked={(form as any)[name]} onChange={handleChange}
                className="w-4 h-4 rounded accent-red-700" />
            </label>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 disabled:opacity-60 font-sans text-sm">
            <Save size={14} /> {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/admin/users"
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 font-sans text-sm text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
