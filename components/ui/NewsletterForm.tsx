"use client";

import { useState } from "react";

type NewsletterFormProps = {
  variant?: "footer" | "sidebar";
};

export default function NewsletterForm({ variant = "footer" }: NewsletterFormProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isSidebar = variant === "sidebar";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    if (!email) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      const nextMessage = data.success
        ? "Thank you for subscribing!"
        : data.error || data.message || "Failed to subscribe";
      setMessage(nextMessage);
      if (data.success) form.reset();
    } catch {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className={isSidebar ? "space-y-2" : "flex flex-col sm:flex-row gap-3 max-w-md mx-auto"}
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        name="email"
        required
        placeholder={isSidebar ? "Your email" : "Enter your email address"}
        className={
          isSidebar
            ? "w-full px-3 py-2 rounded-lg text-gray-900 text-sm font-sans focus:outline-none"
            : "flex-1 px-4 py-2.5 rounded-md text-gray-900 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-white"
        }
      />
      <button
        type="submit"
        disabled={loading}
        className={
          isSidebar
            ? "w-full py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors font-sans disabled:opacity-60"
            : "px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors font-sans whitespace-nowrap disabled:opacity-60"
        }
      >
        {loading ? "Subscribing..." : "Subscribe Free"}
      </button>
      {message && (
        <p className={isSidebar ? "text-xs text-red-100 font-sans" : "text-sm text-red-100 font-sans sm:basis-full"}>
          {message}
        </p>
      )}
    </form>
  );
}
