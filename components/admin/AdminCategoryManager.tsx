"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Save, X } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string; name: string; slug: string; color: string | null;
  icon: string | null; description: string | null; isActive: boolean;
  sortOrder: number; _count: { articles: number };
}

export default function AdminCategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#C8102E", icon: "", description: "" });
  const [editForm, setEditForm] = useState<Partial<Category>>({});

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category created");
        setShowAdd(false);
        setForm({ name: "", color: "#C8102E", icon: "", description: "" });
        router.refresh();
      } else toast.error(data.error || "Failed to create");
    } finally { setLoading(false); }
  };

  const handleEdit = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category updated");
        setEditingId(null);
        router.refresh();
      } else toast.error(data.error || "Failed to update");
    } finally { setLoading(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if ((await res.json()).success) { toast.success("Updated"); router.refresh(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if ((await res.json()).success) { toast.success("Category deactivated"); router.refresh(); }
  };

  return (
    <div>
      {/* Add Form */}
      {showAdd ? (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 font-sans">Add New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 font-sans">Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 font-sans">Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-10 h-9 border border-gray-300 rounded-lg cursor-pointer" />
                <input type="text" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 font-sans">Icon (Emoji)</label>
              <input type="text" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. 🏛️"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 font-sans">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 font-sans">
              <Save size={14} /> {loading ? "Saving..." : "Save Category"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 font-sans">
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 mb-4 font-sans">
          <Plus size={16} /> Add Category
        </button>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Category", "Articles", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input type="color" value={editForm.color || cat.color || "#C8102E"}
                          onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                          className="w-8 h-8 border rounded cursor-pointer" />
                        <input type="text" value={editForm.name ?? cat.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500" />
                        <input type="text" value={editForm.icon ?? (cat.icon || "")}
                          onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none" placeholder="icon" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "#C8102E" }} />
                        <span className="font-medium text-gray-900">{cat.icon} {cat.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{cat._count.articles}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cat.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {editingId === cat.id ? (
                        <>
                          <button onClick={() => handleEdit(cat.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"><Save size={14} /></button>
                          <button onClick={() => setEditingId(null)}
                            className="p-1.5 text-gray-500 hover:bg-gray-50 rounded transition-colors"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(cat.id); setEditForm({}); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => toggleActive(cat.id, cat.isActive)}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 rounded transition-colors">
                            {cat.isActive ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                          </button>
                          <button onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
