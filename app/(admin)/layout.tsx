import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin/dashboard");
  }
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar user={session.user as any} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
