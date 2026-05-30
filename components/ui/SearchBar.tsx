"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for news, topics, people..."
        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-sans focus:outline-none focus:border-red-500 transition-colors"
        autoFocus
      />
      <button
        type="submit"
        className="px-6 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 transition-colors font-sans font-semibold flex items-center gap-2"
      >
        <Search size={18} /> Search
      </button>
    </form>
  );
}
