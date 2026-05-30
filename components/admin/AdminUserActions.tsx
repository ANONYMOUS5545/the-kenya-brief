"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, UserX, UserCheck, Shield, MoreVertical } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Props {
  user: { id: string; isSuspended: boolean; isActive: boolean; role: string };
}

export default function AdminUserActions({ user }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateUser = async (data: object) => {
    setLoading(true); setOpen(false);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (d.success) { toast.success("User updated"); router.refresh(); }
      else toast.error(d.error || "Update failed");
    } finally { setLoading(false); }
  };

  const deleteUser = async () => {
    if (!confirm("Permanently delete this user? All their data will be lost.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) { toast.success("User deleted"); router.refresh(); }
      else toast.error(d.error || "Delete failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="relative flex items-center gap-1">
      <Link href={`/admin/users/edit/${user.id}`}
        className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded" title="Edit">
        <Edit size={15} />
      </Link>
      <div className="relative">
        <button onClick={() => setOpen(!open)} disabled={loading}
          className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded">
          <MoreVertical size={15} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white shadow-xl border border-gray-100 rounded-lg py-1 z-50 w-44"
            onMouseLeave={() => setOpen(false)}>
            {user.isSuspended ? (
              <button onClick={() => updateUser({ isSuspended: false })}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-700 hover:bg-green-50 font-sans">
                <UserCheck size={13} /> Unsuspend User
              </button>
            ) : (
              <button onClick={() => updateUser({ isSuspended: true })}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-yellow-700 hover:bg-yellow-50 font-sans">
                <UserX size={13} /> Suspend User
              </button>
            )}
            {user.role !== "ADMIN" && (
              <>
                <button onClick={() => updateUser({ role: "SENIOR_EDITOR" })}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 font-sans">
                  <Shield size={13} /> Make Senior Editor
                </button>
                <button onClick={() => updateUser({ role: "JUNIOR_EDITOR" })}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 font-sans">
                  <Shield size={13} /> Make Junior Editor
                </button>
                <button onClick={() => updateUser({ role: "READER" })}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 font-sans">
                  <Shield size={13} /> Set as Reader
                </button>
              </>
            )}
            <hr className="my-1 border-gray-100" />
            <button onClick={deleteUser}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-700 hover:bg-red-50 font-sans">
              <Trash2 size={13} /> Delete User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
