export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, UserCheck, UserX, Edit, Trash2, Shield } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import AdminUserActions from "@/components/admin/AdminUserActions";

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  SENIOR_EDITOR: "bg-purple-100 text-purple-800",
  JUNIOR_EDITOR: "bg-blue-100 text-blue-800",
  READER: "bg-gray-100 text-gray-700",
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, isSuspended: true, createdAt: true,
      _count: { select: { articles: true } },
    },
  });

  const roleCounts = {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    SENIOR_EDITOR: users.filter((u) => u.role === "SENIOR_EDITOR").length,
    JUNIOR_EDITOR: users.filter((u) => u.role === "JUNIOR_EDITOR").length,
    READER: users.filter((u) => u.role === "READER").length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Users & Editors</h1>
          <p className="text-gray-500 font-sans text-sm mt-1">{users.length} total users</p>
        </div>
        <Link href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 font-sans">
          <Plus size={16} /> Add User
        </Link>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-gray-900 font-sans">{count}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold font-sans ${roleColors[role]}`}>
              {role.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Role", "Status", "Articles", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{user.name[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isSuspended ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Suspended</span>
                    ) : user.isActive ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user._count.articles}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdminUserActions user={{ id: user.id, isSuspended: user.isSuspended, isActive: user.isActive, role: user.role }} />
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
