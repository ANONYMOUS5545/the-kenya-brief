"use client";
import { useState } from "react";
import { Save, Globe, Mail, Shield, Bell } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  initialSettings: Record<string, string>;
}

export default function AdminSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState({
    site_name: initialSettings.site_name || "The Kenya Brief",
    site_tagline: initialSettings.site_tagline || "Truth. Clarity. Impact.",
    site_description: initialSettings.site_description || "Kenya's trusted source for breaking news.",
    contact_email: initialSettings.contact_email || "news@kenyabrief.co.ke",
    contact_phone: initialSettings.contact_phone || "+254 700 000 000",
    twitter_url: initialSettings.twitter_url || "https://twitter.com/KenyaBrief",
    facebook_url: initialSettings.facebook_url || "https://facebook.com/KenyaBrief",
    instagram_url: initialSettings.instagram_url || "",
    comments_enabled: initialSettings.comments_enabled || "true",
    comments_moderation: initialSettings.comments_moderation || "true",
    newsletter_enabled: initialSettings.newsletter_enabled || "true",
    articles_per_page: initialSettings.articles_per_page || "12",
    breaking_news_enabled: initialSettings.breaking_news_enabled || "true",
    google_analytics_id: initialSettings.google_analytics_id || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings((s) => ({
      ...s,
      [name]: type === "checkbox" ? String((e.target as HTMLInputElement).checked) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) toast.success("Settings saved successfully");
      else toast.error(data.error || "Failed to save settings");
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
        <Icon size={16} className="text-red-700" />
        <h2 className="font-bold text-gray-900 font-sans text-sm">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, name, type = "text", placeholder = "" }: { label: string; name: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 font-sans">{label}</label>
      <input
        type={type} name={name} value={(settings as any)[name]}
        onChange={handleChange} placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
      />
    </div>
  );

  const Toggle = ({ label, name, desc }: { label: string; name: string; desc: string }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700 font-sans">{label}</p>
        <p className="text-xs text-gray-400 font-sans">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => setSettings((s) => ({ ...s, [name]: s[name as keyof typeof s] === "true" ? "false" : "true" }))}
        className={`relative w-10 h-5 rounded-full transition-colors ${(settings as any)[name] === "true" ? "bg-red-700" : "bg-gray-300"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(settings as any)[name] === "true" ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div>
      <Section title="General" icon={Globe}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Site Name" name="site_name" />
          <Field label="Tagline" name="site_tagline" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 font-sans">Site Description</label>
          <textarea name="site_description" value={settings.site_description} onChange={handleChange} rows={2}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 resize-none" />
        </div>
        <Field label="Google Analytics ID" name="google_analytics_id" placeholder="G-XXXXXXXXXX" />
      </Section>

      <Section title="Contact & Social" icon={Mail}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact Email" name="contact_email" type="email" />
          <Field label="Contact Phone" name="contact_phone" />
          <Field label="Twitter URL" name="twitter_url" type="url" />
          <Field label="Facebook URL" name="facebook_url" type="url" />
          <Field label="Instagram URL" name="instagram_url" type="url" />
        </div>
      </Section>

      <Section title="Content" icon={Bell}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Articles Per Page" name="articles_per_page" type="number" />
        </div>
        <div className="space-y-3 pt-2">
          <Toggle label="Breaking News Ticker" name="breaking_news_enabled" desc="Show scrolling breaking news banner" />
          <Toggle label="Newsletter Subscription" name="newsletter_enabled" desc="Allow email newsletter signups" />
        </div>
      </Section>

      <Section title="Comments & Moderation" icon={Shield}>
        <div className="space-y-3">
          <Toggle label="Enable Comments" name="comments_enabled" desc="Allow readers to comment on articles" />
          <Toggle label="Comment Moderation" name="comments_moderation" desc="Require approval before comments are visible" />
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 disabled:opacity-60 font-sans text-sm transition-colors">
          <Save size={15} /> {saving ? "Saving..." : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
