"use client";

import { useState } from "react";
import { RefreshCw, Save, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  initialSettings: Record<string, string>;
  importedCount: number;
};

export default function NewsAutomationControls({ initialSettings, importedCount }: Props) {
  const [settings, setSettings] = useState({
    news_automation_enabled: initialSettings.news_automation_enabled || "true",
    news_automation_duplicate_detection: initialSettings.news_automation_duplicate_detection || "true",
    news_automation_cache_minutes: initialSettings.news_automation_cache_minutes || "4",
    news_automation_category_mapping: initialSettings.news_automation_category_mapping || "keyword",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to save settings");
      toast.success("Automation settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/news/sync");
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Manual refresh failed");
      toast.success(`Imported ${data.imported || 0} articles`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Manual refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const toggle = (name: "news_automation_enabled" | "news_automation_duplicate_detection") => {
    setSettings((current) => ({ ...current, [name]: current[name] === "true" ? "false" : "true" }));
  };

  const ToggleButton = ({ name, label, desc }: { name: "news_automation_enabled" | "news_automation_duplicate_detection"; label: string; desc: string }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700 font-sans">{label}</p>
        <p className="text-xs text-gray-400 font-sans">{desc}</p>
      </div>
      <button type="button" onClick={() => toggle(name)} className="text-red-700">
        {settings[name] === "true" ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-900 font-sans text-sm">News Automation Settings</h2>
      </div>
      <div className="p-5 space-y-5">
        <ToggleButton name="news_automation_enabled" label="Enable Automatic News Updates" desc="Allow scheduled and manual automated news imports" />
        <ToggleButton name="news_automation_duplicate_detection" label="Duplicate Detection" desc="Skip already imported or similar stories" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 font-sans">Cache Controls</label>
            <input
              type="number"
              min="1"
              name="news_automation_cache_minutes"
              value={settings.news_automation_cache_minutes}
              onChange={(e) => setSettings((current) => ({ ...current, news_automation_cache_minutes: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 font-sans">Category Mapping Controls</label>
            <select
              value={settings.news_automation_category_mapping}
              onChange={(e) => setSettings((current) => ({ ...current, news_automation_category_mapping: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 bg-white"
            >
              <option value="keyword">Keyword mapping</option>
              <option value="source">Source assisted</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-sans">
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p className="text-gray-400 text-xs">Last Sync Timestamp</p>
            <p className="font-semibold text-gray-800 break-words">{initialSettings.news_automation_last_sync || "Not yet synced"}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p className="text-gray-400 text-xs">Number of Imported Articles</p>
            <p className="font-semibold text-gray-800">{importedCount}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p className="text-gray-400 text-xs">Failed Import Monitoring</p>
            <p className="font-semibold text-gray-800">See sync logs below</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={refresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-semibold font-sans disabled:opacity-60">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Manual Refresh
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold font-sans disabled:opacity-60">
            <Save size={15} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
