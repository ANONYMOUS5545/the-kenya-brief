"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FileText, PlusCircle, LogOut, ExternalLink, Menu, X } from "lucide-react";
import { useState } from "react";

export default function EditorSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSenior = user?.role === "SENIOR_EDITOR";

  const NAV = [
    { href: "/editor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/editor/articles", icon: FileText, label: "My Articles" },
    { href: "/editor/articles/new", icon: PlusCircle, label: "Write Article" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">KB</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm" style={{ fontFamily: "Georgia, serif" }}>The Kenya Brief</p>
          <p className="text-gray-400 text-xs font-sans">{isSenior ? "Senior Editor" : "Junior Editor"}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-sans text-sm font-medium ${
                active ? "bg-red-700 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}>
              <Icon size={18} /> {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 px-3 py-4 space-y-1">
        <div className="px-3 py-2 mb-2">
          <p className="text-white text-sm font-semibold font-sans">{user?.name}</p>
          <p className="text-gray-400 text-xs font-sans">{user?.email}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded font-sans ${
            isSenior ? "bg-purple-900 text-purple-300" : "bg-blue-900 text-blue-300"
          }`}>
            {user?.role?.replace("_", " ")}
          </span>
        </div>
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors font-sans text-sm">
          <ExternalLink size={18} /> View Site
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-900/50 hover:text-red-300 transition-colors font-sans text-sm">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg"
        onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}
      <aside className={`lg:hidden fixed left-0 top-0 h-full bg-gray-900 z-50 w-64 transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>
      <aside className="hidden lg:flex flex-col bg-gray-900 w-64 shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
