"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search, Menu, X, ChevronDown, User, LogOut,
  Edit3, LayoutDashboard
} from "lucide-react";

const NAV_CATEGORIES = [
  { name: "Politics", slug: "politics" },
  { name: "Business", slug: "business" },
  { name: "Sports", slug: "sports" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Technology", slug: "technology" },
  { name: "Health", slug: "health" },
  { name: "Education", slug: "education" },
  { name: "Environment", slug: "environment" },
  { name: "Counties", slug: "counties" },
  { name: "Lifestyle", slug: "lifestyle" },
  { name: "World", slug: "world" },
];

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 10;

    const loadHeadlines = async () => {
      try {
        const response = await fetch(`/api/news/headlines?t=${Date.now()}`, { 
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        });

        if (!cancelled) {
          const data = await response.json();
          
          if (Array.isArray(data?.headlines) && data.headlines.length > 0) {
            setHeadlines(data.headlines);
            retryCount = 0; // Reset retry count on success
          } else if (retryCount < maxRetries) {
            // If no headlines, retry more aggressively
            retryCount += 1;
            console.log("No headlines found, retrying...", retryCount);
            setTimeout(loadHeadlines, 2000);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load headlines:", err);
          if (retryCount < maxRetries) {
            retryCount += 1;
            setTimeout(loadHeadlines, 2000);
          }
        }
      }
    };
    
    // Load immediately
    loadHeadlines();
    
    // Refresh headlines every 10 seconds for up-to-date breaking news
    const interval = setInterval(loadHeadlines, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const user = session?.user as any;
  const isEditor = user && ["ADMIN", "SENIOR_EDITOR", "JUNIOR_EDITOR"].includes(user.role);

  return (
    <>
      {/* Breaking News Ticker */}
      <div className="bg-red-700 text-white text-xs py-1.5 overflow-hidden">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <span className="bg-white text-red-700 font-bold px-2 py-0.5 text-xs rounded shrink-0 font-sans">
            BREAKING
          </span>
          <div className="overflow-hidden flex-1">
            <div className="animate-marquee whitespace-nowrap font-sans">
              {(headlines.length ? headlines : ["Breaking news and top Kenya stories"]).map((headline) => (
                <span key={headline}>{headline} &nbsp;-&nbsp; </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-gray-900 text-gray-400 text-xs py-1.5 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center font-sans">
          <span>
            {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <div className="flex items-center gap-4">
            {session ? (
              <span className="text-gray-300">Welcome, {user?.name}</span>
            ) : (
              <>
                <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
                <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              </>
            )}
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:text-white transition-colors">About Us</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`bg-white border-b-2 border-red-700 sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? "shadow-lg" : ""}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-red-700 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">KB</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 leading-none block" style={{ fontFamily: "Georgia, serif" }}>
                  The Kenya Brief
                </span>
                <span className="text-xs text-red-700 font-sans font-medium tracking-wide">
                  TRUTH. CLARITY. IMPACT.
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-700 transition-colors font-sans">
                Home
              </Link>
              {NAV_CATEGORIES.slice(0, 6).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-700 transition-colors font-sans whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
              <div className="relative group">
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-700 transition-colors font-sans">
                  More <ChevronDown size={14} />
                </button>
                <div className="absolute top-full right-0 bg-white shadow-xl border border-gray-100 rounded-lg py-2 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {NAV_CATEGORIES.slice(6).map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 font-sans"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search news..."
                    className="w-48 md:w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:border-red-500 font-sans"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-red-700 text-white rounded-r-md hover:bg-red-800 transition-colors"
                  >
                    <Search size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="ml-1 p-1.5 text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-gray-600 hover:text-red-700 transition-colors"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
              )}

              {/* User Menu */}
              {session ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white shadow-xl border border-gray-100 rounded-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 font-sans">{user?.name}</p>
                        <p className="text-xs text-gray-500 font-sans">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-sans font-medium">
                          {user?.role?.replace("_", " ")}
                        </span>
                      </div>
                      {isEditor && (
                        <>
                          {user.role === "ADMIN" && (
                            <Link
                              href="/admin/dashboard"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-sans"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <LayoutDashboard size={14} /> Admin Dashboard
                            </Link>
                          )}
                          {user.role !== "ADMIN" && (
                            <Link
                              href="/editor/dashboard"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-sans"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Edit3 size={14} /> Editor Dashboard
                            </Link>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-sans"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-red-700 text-white text-sm rounded-md hover:bg-red-800 transition-colors font-sans font-medium"
                >
                  <User size={14} /> Sign In
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-red-700 transition-colors"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 py-3 px-4">
            <nav className="flex flex-col gap-1">
              <Link href="/" className="py-2 text-sm font-medium text-gray-700 hover:text-red-700 font-sans" onClick={() => setMenuOpen(false)}>Home</Link>
              {NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="py-2 text-sm font-medium text-gray-700 hover:text-red-700 font-sans border-b border-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              {!session && (
                <div className="flex gap-2 mt-2">
                  <Link href="/login" className="flex-1 text-center py-2 bg-red-700 text-white text-sm rounded-md font-sans" onClick={() => setMenuOpen(false)}>Sign In</Link>
                  <Link href="/register" className="flex-1 text-center py-2 border border-red-700 text-red-700 text-sm rounded-md font-sans" onClick={() => setMenuOpen(false)}>Register</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <style jsx global>{`
        @keyframes marquee {
          from { transform: translateX(100%); }
          to { transform: translateX(-100%); }
        }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>
    </>
  );
}

