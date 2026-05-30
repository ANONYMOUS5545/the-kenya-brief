"use client";
import { Link2, MessageCircle, Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!")).catch(() => {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success("Link copied!");
    });
  };

  const buttons = [
    {
      label: "Facebook",
      letter: "f",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Twitter",
      letter: "𝕏",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "bg-gray-900 hover:bg-black",
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "bg-green-600 hover:bg-green-700",
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {buttons.map(({ label, icon: Icon, letter, href, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-3 py-1.5 ${color} text-white text-xs font-semibold rounded-full font-sans transition-colors`}
        >
          {Icon ? <Icon size={12} /> : <span className="text-xs font-bold">{letter}</span>}
          {label}
        </a>
      ))}
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-full font-sans transition-colors"
      >
        <Link2 size={12} /> Copy Link
      </button>
    </div>
  );
}
