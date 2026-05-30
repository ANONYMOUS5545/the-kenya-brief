import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditorSidebar from "@/components/editor/EditorSidebar";

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!session?.user || !["SENIOR_EDITOR", "JUNIOR_EDITOR", "ADMIN"].includes(user?.role)) {
    redirect("/login?callbackUrl=/editor/dashboard");
  }

  // Redirect admin to admin panel
  if (user?.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <EditorSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
