"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account created! Please sign in.");
        router.push("/login");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">KB</span>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>The Kenya Brief</span>
              <p className="text-xs text-red-700 font-sans tracking-wide font-medium">TRUTH. CLARITY. IMPACT.</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-red-700 px-6 py-5">
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Create Account</h1>
            <p className="text-red-200 text-sm font-sans mt-0.5">Join The Kenya Brief community</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {[
              { label: "Full Name", name: "name", type: "text", placeholder: "John Kamau" },
              { label: "Email Address", name: "email", type: "email", placeholder: "john@example.com" },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">{label}</label>
                <input
                  type={type} name={name} value={(form as any)[name]}
                  onChange={handleChange} required placeholder={placeholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            ))}
            {[
              { label: "Password", name: "password" },
              { label: "Confirm Password", name: "confirm" },
            ].map(({ label, name }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">{label}</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} name={name}
                    value={(form as any)[name]} onChange={handleChange}
                    required placeholder="••••••••" minLength={8}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-sans focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 pr-10"
                  />
                  {name === "password" && (
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors font-sans text-sm">
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-gray-600 font-sans">
              Already have an account?{" "}
              <Link href="/login" className="text-red-700 font-semibold hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
