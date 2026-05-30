import { prisma } from "@/lib/prisma";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

interface Setting { key: string; value: string }

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSettings.findMany();
  const settingsMap = Object.fromEntries(settings.map((s: Setting) => [s.key, s.value]));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Site Settings</h1>
        <p className="text-gray-500 font-sans text-sm mt-1">Configure The Kenya Brief platform settings</p>
      </div>
      <AdminSettingsForm initialSettings={settingsMap} />
    </div>
  );
}
