import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AdminEditUserForm from "@/components/admin/AdminEditUserForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props { params: { id: string } }

export default async function AdminEditUserPage({ params }: Props) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, bio: true, isActive: true, isSuspended: true },
  });
  if (!user) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Edit User</h1>
          <p className="text-gray-500 font-sans text-sm">{user.name}</p>
        </div>
      </div>
      <AdminEditUserForm user={user as any} />
    </div>
  );
}
