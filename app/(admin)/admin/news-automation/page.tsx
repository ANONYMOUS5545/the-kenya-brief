export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import NewsAutomationControls from "@/components/admin/NewsAutomationControls";

export default async function AdminNewsAutomationPage() {
  const [settings, logs, importedCount] = await Promise.all([
    prisma.siteSettings.findMany(),
    prisma.activityLog.findMany({
      where: { action: { startsWith: "NEWS_AUTOMATION" } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.article.count({ where: { isAutomated: true } }),
  ]);
  const settingsMap = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">News Automation</h1>
        <p className="text-gray-500 font-sans text-sm mt-1">Control automated imports, dedupe, cache behavior, source status, and sync logs.</p>
      </div>
      <NewsAutomationControls initialSettings={settingsMap} importedCount={importedCount} />
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-900 font-sans text-sm">Source Status Monitor and Sync Logs</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {logs.length ? logs.map((log) => (
            <div key={log.id} className="p-4">
              <p className="text-xs text-gray-400 font-sans">{log.createdAt.toISOString()}</p>
              <p className="text-sm text-gray-700 font-sans mt-1">{log.details}</p>
            </div>
          )) : (
            <p className="p-4 text-sm text-gray-500 font-sans">No sync logs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
