"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "Georgia, serif" }}>Something went wrong</h1>
        <p className="text-gray-600 font-sans mb-8">An unexpected error occurred. Our team has been notified.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-red-700 text-white rounded-lg font-sans font-semibold hover:bg-red-800">Try Again</button>
          <Link href="/" className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg font-sans hover:bg-gray-50">Home</Link>
        </div>
      </div>
    </div>
  );
}
