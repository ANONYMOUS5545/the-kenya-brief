"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Upload, X, Image as ImageIcon, Video, Tag as TagIcon, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface Category { id: string; name: string; slug: string; color: string | null; }
interface Tag { id: string; name: string; slug: string; }
interface ArticleData {
  id?: string; title?: string; excerpt?: string; content?: string;
  featuredImage?: string; videoUrl?: string; categoryId?: string;
  isFeatured?: boolean; isTrending?: boolean; isBreaking?: boolean;
  metaTitle?: string; metaDescription?: string; status?: string;
  tags?: Array<{ tag: Tag }>;
}

interface Props {
  categories: Category[];
  tags: Tag[];
  article?: ArticleData;
  userRole: string;
  redirectPath: string;
}

export default function ArticleEditor({ categories, tags, article, userRole, redirectPath }: Props) {
  const router = useRouter();
  const isAdmin = ["ADMIN", "SENIOR_EDITOR"].includes(userRole);
  const isEdit = !!article?.id;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: article?.title || "",
    excerpt: article?.excerpt || "",
    content: article?.content || "",
    featuredImage: article?.featuredImage || "",
    videoUrl: article?.videoUrl || "",
    categoryId: article?.categoryId || (categories[0]?.id || ""),
    isFeatured: article?.isFeatured || false,
    isTrending: article?.isTrending || false,
    isBreaking: article?.isBreaking || false,
    metaTitle: article?.metaTitle || "",
    metaDescription: article?.metaDescription || "",
  });

  const [selectedTags, setSelectedTags] = useState<string[]>(
    article?.tags?.map((t) => t.tag.id) || []
  );
  const [newTagName, setNewTagName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({ ...f, featuredImage: data.data.url }));
        toast.success("Image uploaded");
      } else toast.error(data.error || "Upload failed");
    } finally { setUploadingImage(false); }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tag created");
        setSelectedTags((prev) => [...prev, data.data.id]);
        setNewTagName("");
      } else toast.error(data.error || "Failed");
    } catch { toast.error("Failed to create tag"); }
  };

  const handleSave = async (submitStatus: string) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.content.trim()) { toast.error("Content is required"); return; }
    if (!form.categoryId) { toast.error("Category is required"); return; }

    setSaving(true);
    try {
      const payload = { ...form, status: submitStatus, tags: selectedTags };
      const url = isEdit ? `/api/articles/${article!.id}` : "/api/articles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        const actionMsg = {
          DRAFT: "Saved as draft",
          PENDING_REVIEW: "Submitted for review",
          PUBLISHED: "Published successfully",
        }[submitStatus] || "Saved";
        toast.success(actionMsg);
        router.push(redirectPath);
        router.refresh();
      } else {
        toast.error(data.error || "Save failed");
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">
          {isEdit ? "Edit Article" : "New Article"}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 font-sans">
            Cancel
          </button>
          <button onClick={() => handleSave("DRAFT")} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-sans">
            <Save size={14} /> Save Draft
          </button>
          <button onClick={() => handleSave("PENDING_REVIEW")} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-sans">
            <Send size={14} /> Submit for Review
          </button>
          {isAdmin && (
            <button onClick={() => handleSave("PUBLISHED")} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 font-sans font-semibold">
              <Send size={14} /> {saving ? "Publishing..." : "Publish Now"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">Headline *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="Enter a compelling headline..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Excerpt / Summary <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea name="excerpt" value={form.excerpt} onChange={handleChange}
              placeholder="Brief summary of the article (used for SEO and previews)..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 resize-none" />
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
              Article Body *
              <span className="text-xs text-gray-400 font-normal ml-2">Supports HTML formatting</span>
            </label>
            <textarea name="content" value={form.content} onChange={handleChange}
              placeholder="Write the full article content here. You can use HTML tags like <h2>, <p>, <strong>, <em>, <ul>, <li>, <blockquote>..."
              rows={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 resize-y font-mono leading-relaxed" />
            <p className="text-xs text-gray-400 font-sans mt-1">
              {form.content.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Video */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans flex items-center gap-2">
              <Video size={14} /> Video URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input type="url" name="videoUrl" value={form.videoUrl} onChange={handleChange}
              placeholder="https://www.youtube.com/embed/..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500" />
            <p className="text-xs text-gray-400 font-sans mt-1">Use YouTube embed URL format</p>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3 font-sans">SEO Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-sans">Meta Title</label>
                <input type="text" name="metaTitle" value={form.metaTitle} onChange={handleChange}
                  placeholder="SEO title (defaults to article title)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-sans">Meta Description</label>
                <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange}
                  placeholder="SEO description (160 chars max)"
                  rows={2} maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-5">
          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans flex items-center gap-2">
              <ImageIcon size={14} /> Featured Image
            </label>
            {form.featuredImage ? (
              <div className="relative">
                <img src={form.featuredImage} alt="Featured" className="w-full aspect-video object-cover rounded-lg" />
                <button onClick={() => setForm((f) => ({ ...f, featuredImage: "" }))}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-sans mb-2">Upload or enter URL</p>
                <button onClick={() => fileRef.current?.click()} disabled={uploadingImage}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 font-sans">
                  {uploadingImage ? "Uploading..." : "Choose File"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
            )}
            <input type="text" value={form.featuredImage} onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))}
              placeholder="Or paste image URL"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-sans focus:outline-none focus:border-red-500" />
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">Category *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 bg-white">
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans flex items-center gap-2">
              <TagIcon size={14} /> Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-1 text-xs rounded-full font-sans transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "bg-red-700 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  #{tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag..." onKeyPress={(e) => e.key === "Enter" && handleCreateTag()}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-sans focus:outline-none focus:border-red-500" />
              <button type="button" onClick={handleCreateTag}
                className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3 font-sans">Article Flags</label>
            <div className="space-y-2">
              {[
                { name: "isFeatured", label: "Featured Article", desc: "Show in hero section" },
                { name: "isTrending", label: "Trending", desc: "Show in trending section" },
                { name: "isBreaking", label: "Breaking News", desc: "Show breaking badge" },
              ].map(({ name, label, desc }) => (
                <label key={name} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-700 font-sans">{label}</p>
                    <p className="text-xs text-gray-400 font-sans">{desc}</p>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    (form as any)[name] ? "bg-red-700" : "bg-gray-300"
                  }`} onClick={() => setForm((f) => ({ ...f, [name]: !(f as any)[name] }))}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      (form as any)[name] ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Save Buttons (Mobile) */}
          <div className="lg:hidden bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <button onClick={() => handleSave("DRAFT")} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg font-sans">
              <Save size={14} /> Save Draft
            </button>
            <button onClick={() => handleSave("PENDING_REVIEW")} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg font-sans">
              <Send size={14} /> Submit for Review
            </button>
            {isAdmin && (
              <button onClick={() => handleSave("PUBLISHED")} disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 text-white text-sm rounded-lg font-sans font-semibold">
                Publish Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
