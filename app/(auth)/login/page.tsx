"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Newspaper } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState("/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(params.get("callbackUrl") || "/");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email, password, redirect: false,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Signed in successfully!");
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">KB</span>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
                The Kenya Brief
              </span>
              <p className="text-xs text-red-700 font-sans tracking-wide font-medium">TRUTH. CLARITY. IMPACT.</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-red-700 px-6 py-5">
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Sign In</h1>
            <p className="text-red-200 text-sm font-sans mt-0.5">Access your Kenya Brief account</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-sans text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-gray-600 font-sans">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-red-700 font-semibold hover:underline">
                Register free
              </Link>
            </p>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs font-sans text-blue-800">
          <p className="font-bold mb-2">Demo Credentials:</p>
          <div className="space-y-1">
            <p>Admin: admin@kenyabrief.co.ke / Admin@1234</p>
            <p>Senior Editor: senior@kenyabrief.co.ke / Editor@1234</p>
            <p>Junior Editor: junior@kenyabrief.co.ke / Junior@1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
