import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export function generateMetaDescription(content: string): string {
  const stripped = content.replace(/<[^>]+>/g, "");
  return truncateText(stripped, 160);
}

export const CATEGORIES = [
  { name: "Politics", slug: "politics", color: "#DC2626", icon: "🏛️" },
  { name: "Business", slug: "business", color: "#2563EB", icon: "💼" },
  { name: "Sports", slug: "sports", color: "#16A34A", icon: "⚽" },
  { name: "Entertainment", slug: "entertainment", color: "#9333EA", icon: "🎬" },
  { name: "Lifestyle", slug: "lifestyle", color: "#F59E0B", icon: "🌿" },
  { name: "Technology", slug: "technology", color: "#0EA5E9", icon: "💻" },
  { name: "Health", slug: "health", color: "#10B981", icon: "🏥" },
  { name: "Education", slug: "education", color: "#6366F1", icon: "📚" },
  { name: "Environment", slug: "environment", color: "#84CC16", icon: "🌍" },
  { name: "World", slug: "world", color: "#EF4444", icon: "🌐" },
];
