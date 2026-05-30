"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, FileText, Users, FolderOpen, MessageSquare,
  BarChart3, Settings, LogOut, ExternalLink, ChevronLeft, Menu, X
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/articles", icon: FileText, label: "Articles" },
  { href: "/admin/users", icon: Users, label: "Users & Editors" },
  { href: "/admin/categories", icon: FolderOpen, label: "Categories" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-800 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">KB</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "Georgia, serif" }}>The Kenya Brief</p>
            <p className="text-gray-400 text-xs font-sans">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-sans text-sm font-medium ${
                active
                  ? "bg-red-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Actions */}
      <div className="border-t border-gray-800 px-3 py-4 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-semibold font-sans truncate">{user?.name}</p>
            <p className="text-gray-400 text-xs font-sans truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded font-sans">ADMIN</span>
          </div>
        )}
        <Link href="/" target="_blank"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors font-sans text-sm ${collapsed ? "justify-center" : ""}`}>
          <ExternalLink size={18} />
          {!collapsed && <span>View Site</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-900/50 hover:text-red-300 transition-colors font-sans text-sm ${collapsed ? "justify-center" : ""}`}>
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-white transition-colors font-sans text-sm justify-center mt-1">
          <ChevronLeft size={18} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed left-0 top-0 h-full bg-gray-900 z-50 w-64 transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-gray-900 transition-all duration-300 ${collapsed ? "w-16" : "w-64"} shrink-0`}>
        <SidebarContent />
      </aside>
    </>
  );
}
