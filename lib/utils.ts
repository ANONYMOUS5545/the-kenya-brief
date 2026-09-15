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

export function sanitizeRichHtml(html: string): string {
  const allowedTags = new Set([
    "p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li",
    "blockquote", "h2", "h3", "h4", "figure", "figcaption", "img", "iframe",
  ]);
  const allowedAttrs: Record<string, Set<string>> = {
    a: new Set(["href", "title", "target", "rel"]),
    img: new Set(["src", "alt", "title", "width", "height"]),
    iframe: new Set(["src", "title", "allow", "allowfullscreen"]),
  };
  const globalAttrs = new Set(["class"]);
  const safeUrlAttrs = new Set(["href", "src"]);
  const allowedIframeHosts = new Set(["www.youtube.com", "youtube.com", "youtu.be", "player.vimeo.com"]);

  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, (tag) => {
      const closing = /^<\s*\//.test(tag);
      const tagName = tag.match(/^<\s*\/?\s*([a-z0-9]+)/i)?.[1]?.toLowerCase();
      if (!tagName || !allowedTags.has(tagName)) return "";
      if (closing) return `</${tagName}>`;

      const attrs: string[] = [];
      const attrSource = tag.replace(/^<\s*[a-z0-9-]+/i, "").replace(/\/?\s*>$/, "");
      for (const match of attrSource.matchAll(/([a-z0-9:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi)) {
        const name = match[1].toLowerCase();
        const value = match[2] ?? match[3] ?? match[4] ?? "";
        const isAllowed = globalAttrs.has(name) || allowedAttrs[tagName]?.has(name);
        if (!isAllowed || name.startsWith("on")) continue;

        if (safeUrlAttrs.has(name)) {
          const trimmed = value.trim();
          if (/^(javascript|data):/i.test(trimmed)) continue;
          if (tagName === "iframe") {
            try {
              const host = new URL(trimmed).hostname.toLowerCase();
              if (!allowedIframeHosts.has(host)) continue;
            } catch {
              continue;
            }
          }
        }

        const escaped = value
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        attrs.push(`${name}="${escaped}"`);
      }

      if (tagName === "a" && !attrs.some((attr) => attr.startsWith("rel="))) {
        attrs.push('rel="noopener noreferrer"');
      }

      const selfClosing = ["br", "img"].includes(tagName);
      return `<${tagName}${attrs.length ? ` ${attrs.join(" ")}` : ""}${selfClosing ? " />" : ">"}`;
    })
    .trim();
}

export function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
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
