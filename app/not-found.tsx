import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-8xl font-bold text-red-700 mb-4" style={{ fontFamily: "Georgia, serif" }}>404</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "Georgia, serif" }}>Page Not Found</h1>
          <p className="text-gray-600 font-sans mb-8">The article or page you're looking for doesn't exist or has been moved.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="px-6 py-3 bg-red-700 text-white rounded-lg font-sans font-semibold hover:bg-red-800 transition-colors">
              Back to Home
            </Link>
            <Link href="/search" className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg font-sans hover:bg-gray-50 transition-colors">
              Search Articles
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
